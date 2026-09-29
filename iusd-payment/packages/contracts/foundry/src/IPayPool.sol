// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title IPayPool — iUSD Pay payment escrow on BNB Chain
/// @notice Solidity port of the Initia Move module `ipay::pay_v3` (see ../legacy/move/sources/pay_v3.move).
///
/// State machine (unchanged):
///   deposit() -> PENDING_CLAIM -> claim()   -> CONFIRMED
///                              -> revoke()  -> REVOKED   (sender cancels)
///                              -> expire()  -> EXPIRED   (anyone, after TTL)
///   CONFIRMED -> refund() -> REFUNDED  (claimer returns funds to sender)
///
/// Port notes:
///   - One contract = one pool (the Move "pool object" argument is dropped from every call).
///   - The Move FrozenRegistry lives in this contract; the deployer is the permanent freeze admin.
///   - Payment ids are opaque `bytes` (same as Move `vector<u8>`), keyed internally by keccak256.
///   - Claim keys are still verified with SHA-256 (`sha256(claimKey) == claimKeyHash`) so the
///     existing off-chain crypto is unchanged.
///   - Expiry uses `block.timestamp` (the Move version compared a block height against a TTL
///     in seconds).
///   - Amount limits scale with the token's decimals (BSC stables use 18 decimals).
contract IPayPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Status codes (same values as Move) ──────────────────────────────
    uint8 public constant STATUS_PENDING_CLAIM = 2;
    uint8 public constant STATUS_CONFIRMED = 3;
    uint8 public constant STATUS_REVOKED = 5;
    uint8 public constant STATUS_REFUNDED = 6;
    uint8 public constant STATUS_EXPIRED = 7;

    uint256 public constant DEFAULT_CLAIM_TTL = 30 days;

    // ── Errors ──────────────────────────────────────────────────────────
    error NotAuthorized();
    error AlreadyExists();
    error InvalidTransition();
    error PaymentNotFound();
    error ClaimWindowClosed();
    error PaymentNotExpired();
    error InvalidKey();
    error InvalidAmount();
    error NotSender();
    error NotSponsor();
    error AccountFrozen();

    struct Payment {
        uint8 status;
        address sender;
        address claimedBy;
        uint64 createdAt;
        uint64 expiresAt;
        uint256 amount; // net of fee
        uint256 fee;
        bytes32 claimKeyHash; // sha256(claimKey)
        bytes ciphertext;
        bytes keyForSender;
        bytes keyForRecipient;
    }

    IERC20 public immutable token;
    address public immutable owner; // original creator, can never be removed
    uint256 public immutable minAmount; // 0.1 token
    uint256 public immutable maxAmount; // 100,000 tokens

    address public treasury;
    uint256 public feeBps;
    uint256 public feeCap;

    uint256 public totalPayments;
    uint256 public totalVolume;
    uint256 public totalFees;

    mapping(address => bool) private _owners;
    mapping(address => bool) private _sponsors;
    mapping(address => bool) private _freezeAdmins;
    mapping(address => bool) private _frozen;
    mapping(bytes32 => Payment) private _payments;
    mapping(bytes32 => bool) private _claimKeyUsed;

    // ── Events (mirror the Move events) ─────────────────────────────────
    event PaymentCreated(bytes paymentId, address indexed sender, uint256 amount, uint64 expiresAt);
    event PaymentClaimed(bytes paymentId, address indexed claimedBy, uint256 amount);
    event PaymentRevoked(bytes paymentId, address indexed sender, uint256 amount);
    event PaymentExpired(bytes paymentId, address indexed sender, uint256 amount);
    event PaymentRefunded(bytes paymentId, address indexed recipient, address indexed sender, uint256 amount);
    event OwnerAdded(address indexed newOwner, address indexed addedBy);
    event OwnerRemoved(address indexed removedOwner, address indexed removedBy);
    event EmergencyWithdraw(address indexed to, uint256 amount, address indexed withdrawnBy);
    event AddressFrozen(address indexed addr, address indexed frozenBy);
    event AddressUnfrozen(address indexed addr, address indexed unfrozenBy);

    constructor(IERC20 token_, uint256 feeBps_, uint256 feeCap_) {
        if (feeBps_ > 1000) revert InvalidAmount(); // max 10%
        token = token_;
        owner = msg.sender;
        treasury = msg.sender;
        feeBps = feeBps_;
        feeCap = feeCap_;
        _owners[msg.sender] = true;
        _freezeAdmins[msg.sender] = true;
        uint256 unit = 10 ** IERC20Metadata(address(token_)).decimals();
        minAmount = unit / 10;
        maxAmount = 100_000 * unit;
    }

    // ── Modifiers ───────────────────────────────────────────────────────
    modifier onlyPoolOwner() {
        if (!isOwner(msg.sender)) revert NotAuthorized();
        _;
    }

    modifier onlyFreezeAdmin() {
        if (!isFreezeAdmin(msg.sender)) revert NotAuthorized();
        _;
    }

    // ====================================================================
    // FREEZE REGISTRY (multi-admin)
    // ====================================================================

    function addFreezeAdmin(address newAdmin) external onlyFreezeAdmin {
        _freezeAdmins[newAdmin] = true;
    }

    function removeFreezeAdmin(address target) external onlyFreezeAdmin {
        if (target == owner) revert NotAuthorized();
        _freezeAdmins[target] = false;
    }

    function freezeAddress(address target) external onlyFreezeAdmin {
        _frozen[target] = true;
        emit AddressFrozen(target, msg.sender);
    }

    function unfreezeAddress(address target) external onlyFreezeAdmin {
        _frozen[target] = false;
        emit AddressUnfrozen(target, msg.sender);
    }

    // ====================================================================
    // CORE
    // ====================================================================

    function deposit(
        bytes calldata paymentId,
        uint256 amount,
        bytes calldata ciphertext,
        bytes calldata keyForSender,
        bytes calldata keyForRecipient,
        bytes calldata claimKeyHash,
        uint256 ttlSeconds
    ) external nonReentrant {
        if (_frozen[msg.sender]) revert AccountFrozen();
        if (amount < minAmount || amount > maxAmount) revert InvalidAmount();
        if (claimKeyHash.length != 32) revert InvalidKey();
        if (ttlSeconds > 3650 days) revert InvalidAmount(); // keeps the uint64 expiry cast safe

        bytes32 key = keccak256(paymentId);
        if (_payments[key].status != 0) revert AlreadyExists();
        bytes32 ckh = bytes32(claimKeyHash);
        if (_claimKeyUsed[ckh]) revert AlreadyExists();

        uint256 fee = (amount * feeBps) / 10000;
        if (fee > feeCap) fee = feeCap;
        uint256 net = amount - fee;

        token.safeTransferFrom(msg.sender, address(this), amount);
        if (fee > 0) token.safeTransfer(treasury, fee);

        uint64 nowTs = uint64(block.timestamp);
        uint64 expiresAt = nowTs + uint64(ttlSeconds > 0 ? ttlSeconds : DEFAULT_CLAIM_TTL);

        Payment storage p = _payments[key];
        p.status = STATUS_PENDING_CLAIM;
        p.sender = msg.sender;
        p.createdAt = nowTs;
        p.expiresAt = expiresAt;
        p.amount = net;
        p.fee = fee;
        p.claimKeyHash = ckh;
        p.ciphertext = ciphertext;
        p.keyForSender = keyForSender;
        p.keyForRecipient = keyForRecipient;
        _claimKeyUsed[ckh] = true;

        totalPayments += 1;
        totalVolume += amount;
        totalFees += fee;

        emit PaymentCreated(paymentId, msg.sender, net, expiresAt);
    }

    function claim(bytes calldata paymentId, bytes calldata claimKey) external nonReentrant {
        if (_frozen[msg.sender]) revert AccountFrozen();
        _claim(paymentId, claimKey, msg.sender);
    }

    /// @notice Relayer claims on behalf of `recipient` (gas sponsorship).
    function sponsorClaim(bytes calldata paymentId, bytes calldata claimKey, address recipient)
        external
        nonReentrant
    {
        if (!_sponsors[msg.sender]) revert NotSponsor();
        if (_frozen[recipient]) revert AccountFrozen();
        _claim(paymentId, claimKey, recipient);
    }

    function _claim(bytes calldata paymentId, bytes calldata claimKey, address recipient) internal {
        Payment storage p = _payments[keccak256(paymentId)];
        if (p.status == 0) revert PaymentNotFound();
        if (p.status != STATUS_PENDING_CLAIM) revert InvalidTransition();
        if (sha256(claimKey) != p.claimKeyHash) revert InvalidKey();
        if (block.timestamp > p.expiresAt) revert ClaimWindowClosed();

        p.status = STATUS_CONFIRMED;
        p.claimedBy = recipient;
        token.safeTransfer(recipient, p.amount);

        emit PaymentClaimed(paymentId, recipient, p.amount);
    }

    function revoke(bytes calldata paymentId) external nonReentrant {
        Payment storage p = _payments[keccak256(paymentId)];
        if (p.status == 0) revert PaymentNotFound();
        if (p.sender != msg.sender) revert NotSender();
        if (p.status != STATUS_PENDING_CLAIM) revert InvalidTransition();

        p.status = STATUS_REVOKED;
        token.safeTransfer(msg.sender, p.amount);

        emit PaymentRevoked(paymentId, msg.sender, p.amount);
    }

    /// @notice Claimed recipient returns funds to the sender. Requires token approval.
    function refund(bytes calldata paymentId) external nonReentrant {
        Payment storage p = _payments[keccak256(paymentId)];
        if (p.status == 0) revert PaymentNotFound();
        if (p.claimedBy != msg.sender) revert NotAuthorized();
        if (p.status != STATUS_CONFIRMED) revert InvalidTransition();

        p.status = STATUS_REFUNDED;
        token.safeTransferFrom(msg.sender, p.sender, p.amount);

        emit PaymentRefunded(paymentId, msg.sender, p.sender, p.amount);
    }

    /// @notice Anyone may return an expired, unclaimed payment to its sender.
    function expire(bytes calldata paymentId) external nonReentrant {
        Payment storage p = _payments[keccak256(paymentId)];
        if (p.status == 0) revert PaymentNotFound();
        if (p.status != STATUS_PENDING_CLAIM) revert InvalidTransition();
        if (block.timestamp <= p.expiresAt) revert PaymentNotExpired();

        p.status = STATUS_EXPIRED;
        token.safeTransfer(p.sender, p.amount);

        emit PaymentExpired(paymentId, p.sender, p.amount);
    }

    // ====================================================================
    // ADMIN
    // ====================================================================

    function addOwner(address newOwner) external onlyPoolOwner {
        _owners[newOwner] = true;
        emit OwnerAdded(newOwner, msg.sender);
    }

    function removeOwner(address target) external onlyPoolOwner {
        if (target == owner) revert NotAuthorized();
        _owners[target] = false;
        emit OwnerRemoved(target, msg.sender);
    }

    /// @notice Recover funds trapped by a bug. Owners only.
    function emergencyWithdraw(address to, uint256 amount) external onlyPoolOwner nonReentrant {
        token.safeTransfer(to, amount);
        emit EmergencyWithdraw(to, amount, msg.sender);
    }

    function addSponsor(address sponsor) external onlyPoolOwner {
        _sponsors[sponsor] = true;
    }

    function removeSponsor(address sponsor) external onlyPoolOwner {
        _sponsors[sponsor] = false;
    }

    function setTreasury(address newTreasury) external onlyPoolOwner {
        treasury = newTreasury;
    }

    function setFee(uint256 feeBps_, uint256 feeCap_) external onlyPoolOwner {
        if (feeBps_ > 1000) revert InvalidAmount(); // max 10%
        feeBps = feeBps_;
        feeCap = feeCap_;
    }

    // ====================================================================
    // VIEWS
    // ====================================================================

    function isOwner(address addr) public view returns (bool) {
        return addr == owner || _owners[addr];
    }

    function isSponsor(address addr) external view returns (bool) {
        return _sponsors[addr];
    }

    function isFreezeAdmin(address addr) public view returns (bool) {
        return addr == owner || _freezeAdmins[addr];
    }

    function isFrozen(address addr) external view returns (bool) {
        return _frozen[addr];
    }

    /// @return status, amount, sender, createdAt, expiresAt (all zero if not found)
    function getPayment(bytes calldata paymentId)
        external
        view
        returns (uint8, uint256, address, uint64, uint64)
    {
        Payment storage p = _payments[keccak256(paymentId)];
        return (p.status, p.amount, p.sender, p.createdAt, p.expiresAt);
    }

    /// @return status, amount, fee, sender, claimedBy, createdAt, expiresAt,
    ///         ciphertext, keyForSender, keyForRecipient, claimKeyHash
    function getPaymentFull(bytes calldata paymentId)
        external
        view
        returns (
            uint8,
            uint256,
            uint256,
            address,
            address,
            uint64,
            uint64,
            bytes memory,
            bytes memory,
            bytes memory,
            bytes memory
        )
    {
        Payment storage p = _payments[keccak256(paymentId)];
        bytes memory ckh = p.status == 0 ? bytes("") : abi.encodePacked(p.claimKeyHash);
        return (
            p.status,
            p.amount,
            p.fee,
            p.sender,
            p.claimedBy,
            p.createdAt,
            p.expiresAt,
            p.ciphertext,
            p.keyForSender,
            p.keyForRecipient,
            ckh
        );
    }

    function getPoolStats() external view returns (uint256, uint256, uint256) {
        return (totalPayments, totalVolume, totalFees);
    }

    function getPoolConfig() external view returns (address, address, uint256, uint256) {
        return (owner, treasury, feeBps, feeCap);
    }
}
