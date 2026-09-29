// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title IPayGiftPool — iUSD Pay gift boxes / red envelopes on BNB Chain
/// @notice Solidity port of the Initia Move module `ipay::gift_v3` (see ../legacy/move/sources/gift_v3.move).
///
///   sendGift / sendGiftGroup / sendGiftGroupEqual -> ACTIVE
///     claimDirect / claimSlot  -> slot CLAIMED (packet COMPLETED when all slots are claimed)
///     expireAndRefund          -> unclaimed slots EXPIRED, refund to sender
///
/// Hashing is kept byte-compatible with the Move version so the existing client crypto works:
///   direct:  sha256(claimKey) == claimKeyHash
///   group:   sha256(slotSecret) == slotHashes[i]
///            proof == sha256(slotSecret || recipient as 32-byte left-padded address)
///   random split: sha256(seed || uint64 LE index), first 8 bytes big-endian
/// Expiry uses `block.timestamp`. Amount limits scale with the token's decimals.
contract IPayGiftPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint8 public constant MODE_DIRECT = 0;
    uint8 public constant MODE_GROUP = 1;

    uint8 public constant SLOT_OPEN = 0;
    uint8 public constant SLOT_CLAIMED = 1;
    uint8 public constant SLOT_EXPIRED = 2;

    uint8 public constant STATUS_ACTIVE = 0;
    uint8 public constant STATUS_COMPLETED = 1;
    uint8 public constant STATUS_EXPIRED = 2;

    uint256 public constant MAX_SLOTS = 200;
    uint256 public constant MAX_TTL = 7 days;

    error NotAuthorized();
    error NotSponsor();
    error BoxNotFound();
    error BoxDisabled();
    error BoxExists();
    error AmountTooLow();
    error AmountTooHigh();
    error TooManySlots();
    error PacketNotFound();
    error PacketExpired();
    error PacketNotExpired();
    error SlotNotOpen();
    error SlotOutOfRange();
    error InvalidSecret();
    error InvalidProof();
    error DuplicatePacket();
    error WrongMode();
    error ZeroSlots();
    error InvalidFee();

    struct BoxDef {
        uint64 boxId;
        string name;
        uint256 amount; // fixed amount (0 = flexible, sender chooses)
        uint256 feeBps;
        string[] urls;
        bool enabled;
        bool exists;
    }

    struct GiftSlot {
        uint256 amount;
        uint8 status;
        address claimedBy;
        uint64 claimedAt;
    }

    struct GiftPacket {
        bytes packetId;
        uint64 boxId;
        address sender;
        uint8 mode;
        uint8 status;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 totalSlots;
        uint64 claimedSlots;
        uint256 amount;
        uint256 fee;
        bytes recipientBlob; // ECIES ciphertext (direct mode only)
        bytes32 claimKeyHash; // direct mode only
        bytes allocationSeed;
        bool exists;
    }

    IERC20 public immutable token;
    address public immutable owner;
    uint256 public immutable minAmount; // 0.1 token
    uint256 public immutable minSlotShare; // 0.01 token

    address public treasury;
    uint256 public cap; // max flexible amount per gift (default 1000 tokens)

    uint256 public totalGifts;
    uint256 public totalVolume;
    uint256 public totalFees;

    mapping(address => bool) private _owners;
    mapping(address => bool) private _sponsors;
    mapping(uint64 => BoxDef) private _boxes;
    uint64[] private _boxIds;
    mapping(bytes32 => GiftPacket) private _packets;
    mapping(bytes32 => GiftSlot[]) private _slots;
    mapping(bytes32 => bytes32[]) private _slotHashes;

    event BoxRegistered(uint64 indexed boxId, string name, uint256 amount, uint256 feeBps, bool enabled);
    event BoxUpdated(uint64 indexed boxId, string name, uint256 amount, uint256 feeBps, bool enabled);
    event BoxRemoved(uint64 indexed boxId);
    event BoxListed(uint64 indexed boxId);
    event BoxDelisted(uint64 indexed boxId);
    event OwnerAdded(address indexed newOwner, address indexed addedBy);
    event OwnerRemoved(address indexed removedOwner, address indexed removedBy);
    event EmergencyWithdraw(address indexed to, uint256 amount, address indexed withdrawnBy);
    event GiftSent(
        bytes packetId,
        address indexed sender,
        uint64 indexed boxId,
        uint8 mode,
        uint256 amount,
        uint256 fee,
        uint64 totalSlots,
        uint64 expiresAt
    );
    event GiftClaimed(bytes packetId, uint64 slotIndex, address indexed claimedBy, uint256 amount);
    event GiftExpired(bytes packetId, address indexed sender, uint256 refundAmount, uint64 unclaimedSlots);

    constructor(IERC20 token_) {
        token = token_;
        owner = msg.sender;
        treasury = msg.sender;
        _owners[msg.sender] = true;
        uint256 unit = 10 ** IERC20Metadata(address(token_)).decimals();
        minAmount = unit / 10;
        minSlotShare = unit / 100;
        cap = 1000 * unit;
    }

    modifier onlyPoolOwner() {
        if (!isOwner(msg.sender)) revert NotAuthorized();
        _;
    }

    modifier onlySponsor() {
        if (!_sponsors[msg.sender]) revert NotSponsor();
        _;
    }

    // ====================================================================
    // ADMIN: POOL CONFIG / OWNERS
    // ====================================================================

    function setCap(uint256 newCap) external onlyPoolOwner {
        cap = newCap;
    }

    function setTreasury(address newTreasury) external onlyPoolOwner {
        treasury = newTreasury;
    }

    function addSponsor(address sponsor) external onlyPoolOwner {
        _sponsors[sponsor] = true;
    }

    function removeSponsor(address sponsor) external onlyPoolOwner {
        _sponsors[sponsor] = false;
    }

    function addOwner(address newOwner) external onlyPoolOwner {
        _owners[newOwner] = true;
        emit OwnerAdded(newOwner, msg.sender);
    }

    function removeOwner(address target) external onlyPoolOwner {
        if (target == owner) revert NotAuthorized();
        _owners[target] = false;
        emit OwnerRemoved(target, msg.sender);
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyPoolOwner nonReentrant {
        token.safeTransfer(to, amount);
        emit EmergencyWithdraw(to, amount, msg.sender);
    }

    // ====================================================================
    // ADMIN: BOX MANAGEMENT
    // ====================================================================

    function registerBox(
        uint64 boxId,
        string calldata name,
        uint256 amount,
        uint256 feeBps,
        string[] calldata urls,
        bool enabled
    ) external onlyPoolOwner {
        if (_boxes[boxId].exists) revert BoxExists();
        if (feeBps > 10000) revert InvalidFee();
        _boxes[boxId] = BoxDef(boxId, name, amount, feeBps, urls, enabled, true);
        _boxIds.push(boxId);
        emit BoxRegistered(boxId, name, amount, feeBps, enabled);
    }

    function updateBox(
        uint64 boxId,
        string calldata name,
        uint256 amount,
        uint256 feeBps,
        string[] calldata urls,
        bool enabled
    ) external onlyPoolOwner {
        if (!_boxes[boxId].exists) revert BoxNotFound();
        if (feeBps > 10000) revert InvalidFee();
        _boxes[boxId] = BoxDef(boxId, name, amount, feeBps, urls, enabled, true);
        emit BoxUpdated(boxId, name, amount, feeBps, enabled);
    }

    function removeBox(uint64 boxId) external onlyPoolOwner {
        if (!_boxes[boxId].exists) revert BoxNotFound();
        delete _boxes[boxId];
        uint256 len = _boxIds.length;
        for (uint256 i = 0; i < len; i++) {
            if (_boxIds[i] == boxId) {
                // preserve order, like Move's vector::remove
                for (uint256 j = i; j + 1 < len; j++) _boxIds[j] = _boxIds[j + 1];
                _boxIds.pop();
                break;
            }
        }
        emit BoxRemoved(boxId);
    }

    function listBox(uint64 boxId) external onlyPoolOwner {
        if (!_boxes[boxId].exists) revert BoxNotFound();
        _boxes[boxId].enabled = true;
        emit BoxListed(boxId);
    }

    function delistBox(uint64 boxId) external onlyPoolOwner {
        if (!_boxes[boxId].exists) revert BoxNotFound();
        _boxes[boxId].enabled = false;
        emit BoxDelisted(boxId);
    }

    // ====================================================================
    // SENDER
    // ====================================================================

    /// @notice Direct gift. Recipient identity stays off-chain inside `recipientBlob`.
    function sendGift(
        uint64 boxId,
        bytes calldata packetId,
        bytes calldata recipientBlob,
        bytes calldata claimKeyHash,
        uint256 amount,
        uint256 ttl
    ) external nonReentrant {
        if (claimKeyHash.length != 32) revert InvalidSecret();
        GiftPacket storage p = _newPacket(boxId, packetId, amount, ttl, MODE_DIRECT, 1);
        p.recipientBlob = recipientBlob;
        p.claimKeyHash = bytes32(claimKeyHash);
    }

    /// @notice Group gift, bounded-random split derived from `allocationSeed`.
    function sendGiftGroup(
        uint64 boxId,
        bytes calldata packetId,
        uint256 numSlots,
        uint256 amount,
        bytes calldata allocationSeed,
        bytes[] calldata slotHashes,
        uint256 ttl
    ) external nonReentrant {
        _checkSlots(numSlots, slotHashes.length);
        GiftPacket storage p = _newPacket(boxId, packetId, amount, ttl, MODE_GROUP, uint64(numSlots));
        p.allocationSeed = allocationSeed;
        bytes32 key = keccak256(packetId);
        _storeSlotHashes(key, slotHashes);
        _allocateRandom(key, p.amount, numSlots, allocationSeed);
    }

    /// @notice Group gift, equal split (last slot takes the remainder).
    function sendGiftGroupEqual(
        uint64 boxId,
        bytes calldata packetId,
        uint256 numSlots,
        uint256 amount,
        bytes[] calldata slotHashes,
        uint256 ttl
    ) external nonReentrant {
        _checkSlots(numSlots, slotHashes.length);
        GiftPacket storage p = _newPacket(boxId, packetId, amount, ttl, MODE_GROUP, uint64(numSlots));
        bytes32 key = keccak256(packetId);
        _storeSlotHashes(key, slotHashes);
        uint256 total = p.amount;
        uint256 per = total / numSlots;
        GiftSlot[] storage slots = _slots[key];
        for (uint256 i = 0; i < numSlots; i++) {
            uint256 a = i == numSlots - 1 ? total - per * (numSlots - 1) : per;
            slots.push(GiftSlot(a, SLOT_OPEN, address(0), 0));
        }
    }

    // ====================================================================
    // RECIPIENT
    // ====================================================================

    function claimDirect(bytes calldata packetId, bytes calldata claimKey) external nonReentrant {
        _claimDirect(packetId, claimKey, msg.sender);
    }

    function sponsorClaimDirect(bytes calldata packetId, bytes calldata claimKey, address recipient)
        external
        onlySponsor
        nonReentrant
    {
        _claimDirect(packetId, claimKey, recipient);
    }

    function claimSlot(bytes calldata packetId, uint256 slotIndex, bytes calldata slotSecret, bytes calldata proof)
        external
        nonReentrant
    {
        _claimSlot(packetId, slotIndex, slotSecret, proof, msg.sender);
    }

    function sponsorClaimSlot(
        bytes calldata packetId,
        uint256 slotIndex,
        bytes calldata slotSecret,
        bytes calldata proof,
        address recipient
    ) external onlySponsor nonReentrant {
        _claimSlot(packetId, slotIndex, slotSecret, proof, recipient);
    }

    // ====================================================================
    // RELAYER: EXPIRE AND REFUND
    // ====================================================================

    function expireAndRefund(bytes calldata packetId) external onlySponsor nonReentrant {
        bytes32 key = keccak256(packetId);
        GiftPacket storage p = _packets[key];
        if (!p.exists) revert PacketNotFound();
        if (p.status != STATUS_ACTIVE) revert SlotNotOpen();
        if (block.timestamp <= p.expiresAt) revert PacketNotExpired();

        uint256 refundAmount;
        uint64 unclaimed;
        if (p.mode == MODE_DIRECT) {
            if (p.claimedSlots == 0) {
                refundAmount = p.amount;
                unclaimed = 1;
            }
        } else {
            GiftSlot[] storage slots = _slots[key];
            for (uint256 i = 0; i < slots.length; i++) {
                if (slots[i].status == SLOT_OPEN) {
                    refundAmount += slots[i].amount;
                    unclaimed += 1;
                    slots[i].status = SLOT_EXPIRED;
                }
            }
        }

        p.status = STATUS_EXPIRED;
        if (refundAmount > 0) token.safeTransfer(p.sender, refundAmount);
        emit GiftExpired(packetId, p.sender, refundAmount, unclaimed);
    }

    // ====================================================================
    // INTERNAL
    // ====================================================================

    function _checkSlots(uint256 numSlots, uint256 hashCount) internal pure {
        if (numSlots == 0) revert ZeroSlots();
        if (numSlots > MAX_SLOTS || hashCount != numSlots) revert TooManySlots();
    }

    function _storeSlotHashes(bytes32 key, bytes[] calldata slotHashes) internal {
        bytes32[] storage hs = _slotHashes[key];
        for (uint256 i = 0; i < slotHashes.length; i++) {
            if (slotHashes[i].length != 32) revert InvalidSecret();
            hs.push(bytes32(slotHashes[i]));
        }
    }

    /// @dev Validates the box, resolves amount + fee, pulls funds, routes the fee, writes the packet header.
    function _newPacket(
        uint64 boxId,
        bytes calldata packetId,
        uint256 amount,
        uint256 ttl,
        uint8 mode,
        uint64 totalSlots
    ) internal returns (GiftPacket storage p) {
        bytes32 key = keccak256(packetId);
        if (_packets[key].exists) revert DuplicatePacket();
        (uint256 giftAmount, uint256 fee) = quoteGift(boxId, amount);

        uint256 ttlVal = (ttl > 0 && ttl <= MAX_TTL) ? ttl : MAX_TTL;
        uint64 nowTs = uint64(block.timestamp);

        token.safeTransferFrom(msg.sender, address(this), giftAmount + fee);
        if (fee > 0) token.safeTransfer(treasury, fee);

        p = _packets[key];
        p.packetId = packetId;
        p.boxId = boxId;
        p.sender = msg.sender;
        p.mode = mode;
        p.status = STATUS_ACTIVE;
        p.createdAt = nowTs;
        p.expiresAt = nowTs + uint64(ttlVal);
        p.totalSlots = totalSlots;
        p.amount = giftAmount;
        p.fee = fee;
        p.exists = true;

        totalGifts += 1;
        totalVolume += giftAmount;
        totalFees += fee;

        emit GiftSent(packetId, msg.sender, boxId, mode, giftAmount, fee, totalSlots, p.expiresAt);
    }

    function _claimDirect(bytes calldata packetId, bytes calldata claimKey, address recipient) internal {
        GiftPacket storage p = _packets[keccak256(packetId)];
        if (!p.exists) revert PacketNotFound();
        if (p.mode != MODE_DIRECT) revert WrongMode();
        if (p.status != STATUS_ACTIVE) revert SlotNotOpen();
        if (sha256(claimKey) != p.claimKeyHash) revert InvalidSecret();
        if (block.timestamp > p.expiresAt) revert PacketExpired();

        p.claimedSlots = 1;
        p.status = STATUS_COMPLETED;
        token.safeTransfer(recipient, p.amount);

        emit GiftClaimed(packetId, 0, recipient, p.amount);
    }

    function _claimSlot(
        bytes calldata packetId,
        uint256 slotIndex,
        bytes calldata slotSecret,
        bytes calldata proof,
        address recipient
    ) internal {
        bytes32 key = keccak256(packetId);
        GiftPacket storage p = _packets[key];
        if (!p.exists) revert PacketNotFound();
        if (p.mode != MODE_GROUP) revert WrongMode();
        if (p.status != STATUS_ACTIVE) revert SlotNotOpen();
        if (slotIndex >= p.totalSlots) revert SlotOutOfRange();
        if (block.timestamp > p.expiresAt) revert PacketExpired();

        GiftSlot storage s = _slots[key][slotIndex];
        if (s.status != SLOT_OPEN) revert SlotNotOpen();
        if (sha256(slotSecret) != _slotHashes[key][slotIndex]) revert InvalidSecret();
        // MEV protection: proof binds the secret to the recipient (32-byte padded, like Move BCS).
        bytes32 expected = sha256(abi.encodePacked(slotSecret, bytes32(uint256(uint160(recipient)))));
        if (proof.length != 32 || bytes32(proof) != expected) revert InvalidProof();

        s.status = SLOT_CLAIMED;
        s.claimedBy = recipient;
        s.claimedAt = uint64(block.timestamp);
        p.claimedSlots += 1;
        if (p.claimedSlots == p.totalSlots) p.status = STATUS_COMPLETED;

        if (s.amount > 0) token.safeTransfer(recipient, s.amount);
        emit GiftClaimed(packetId, uint64(slotIndex), recipient, s.amount);
    }

    /// @dev Same bounded-random algorithm as gift_v3::allocate_slots.
    function _allocateRandom(bytes32 key, uint256 total, uint256 numSlots, bytes calldata seed) internal {
        GiftSlot[] storage slots = _slots[key];
        uint256 remaining = total;
        uint256 avg = total / numSlots;
        uint256 boundMin = avg / 2 > minSlotShare ? avg / 2 : minSlotShare;
        uint256 boundMax = avg + avg / 2;

        for (uint256 i = 0; i < numSlots; i++) {
            uint256 share;
            if (i == numSlots - 1) {
                share = remaining;
            } else {
                uint256 minReserved = (numSlots - i - 1) * boundMin;
                uint256 effMax;
                if (remaining > minReserved + boundMin) {
                    uint256 m = remaining - minReserved;
                    effMax = m > boundMax ? boundMax : m;
                } else {
                    effMax = boundMin;
                }
                uint256 effMin = remaining > minReserved ? boundMin : minSlotShare;
                uint256 randVal = uint64(bytes8(sha256(abi.encodePacked(seed, _u64le(uint64(i))))));
                uint256 range = effMax > effMin ? effMax - effMin : 0;
                share = range > 0 ? effMin + (randVal % range) : effMin;
                remaining -= share;
            }
            slots.push(GiftSlot(share, SLOT_OPEN, address(0), 0));
        }
    }

    /// @dev BCS encoding of a u64: 8 bytes little-endian.
    function _u64le(uint64 v) internal pure returns (bytes8 out) {
        uint64 r;
        for (uint256 i = 0; i < 8; i++) {
            r = (r << 8) | ((v >> (8 * i)) & 0xff);
        }
        out = bytes8(r);
    }

    // ====================================================================
    // VIEWS
    // ====================================================================

    /// @notice Resolve the amount a sender pays for a box: (giftAmount, fee). Pull = giftAmount + fee.
    function quoteGift(uint64 boxId, uint256 amount) public view returns (uint256 giftAmount, uint256 fee) {
        BoxDef storage box = _boxes[boxId];
        if (!box.exists) revert BoxNotFound();
        if (!box.enabled) revert BoxDisabled();
        if (box.amount > 0) {
            giftAmount = box.amount;
        } else {
            if (amount < minAmount) revert AmountTooLow();
            if (amount > cap) revert AmountTooHigh();
            giftAmount = amount;
        }
        fee = (giftAmount * box.feeBps) / 10000;
    }

    function getBoxIds() external view returns (uint64[] memory) {
        return _boxIds;
    }

    function getBox(uint64 boxId)
        external
        view
        returns (uint64, string memory, uint256, uint256, string[] memory, bool)
    {
        BoxDef storage b = _boxes[boxId];
        if (!b.exists) revert BoxNotFound();
        return (b.boxId, b.name, b.amount, b.feeBps, b.urls, b.enabled);
    }

    function isBoxListed(uint64 boxId) external view returns (bool) {
        if (!_boxes[boxId].exists) revert BoxNotFound();
        return _boxes[boxId].enabled;
    }

    function getBoxCount() external view returns (uint256) {
        return _boxIds.length;
    }

    /// @return packetId, boxId, sender, mode, recipientBlob, amount, totalSlots, claimedSlots,
    ///         fee, status, createdAt, expiresAt
    function getPacket(bytes calldata packetId)
        external
        view
        returns (bytes memory, uint64, address, uint8, bytes memory, uint256, uint64, uint64, uint256, uint8, uint64, uint64)
    {
        GiftPacket storage p = _packets[keccak256(packetId)];
        if (!p.exists) revert PacketNotFound();
        return (
            p.packetId,
            p.boxId,
            p.sender,
            p.mode,
            p.recipientBlob,
            p.amount,
            p.totalSlots,
            p.claimedSlots,
            p.fee,
            p.status,
            p.createdAt,
            p.expiresAt
        );
    }

    function getRecipientBlob(bytes calldata packetId) external view returns (bytes memory, bytes memory) {
        GiftPacket storage p = _packets[keccak256(packetId)];
        if (!p.exists) revert PacketNotFound();
        bytes memory ckh = p.mode == MODE_DIRECT ? abi.encodePacked(p.claimKeyHash) : bytes("");
        return (p.recipientBlob, ckh);
    }

    /// @notice Slot info; amount is hidden (0) until the slot is claimed or expired.
    function getSlot(bytes calldata packetId, uint256 slotIndex)
        external
        view
        returns (uint256, uint8, address, uint64)
    {
        bytes32 key = keccak256(packetId);
        if (!_packets[key].exists) revert PacketNotFound();
        if (slotIndex >= _slots[key].length) revert SlotOutOfRange();
        GiftSlot storage s = _slots[key][slotIndex];
        uint256 visible = s.status == SLOT_OPEN ? 0 : s.amount;
        return (visible, s.status, s.claimedBy, s.claimedAt);
    }

    function getSlotsSummary(bytes calldata packetId)
        external
        view
        returns (uint8[] memory statuses, address[] memory claimers, uint256[] memory amounts)
    {
        bytes32 key = keccak256(packetId);
        if (!_packets[key].exists) revert PacketNotFound();
        GiftSlot[] storage slots = _slots[key];
        uint256 n = slots.length;
        statuses = new uint8[](n);
        claimers = new address[](n);
        amounts = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            statuses[i] = slots[i].status;
            claimers[i] = slots[i].claimedBy;
            amounts[i] = slots[i].status == SLOT_OPEN ? 0 : slots[i].amount;
        }
    }

    function getPoolStats() external view returns (address, address, uint256, uint256, uint256, uint256) {
        return (owner, treasury, cap, totalGifts, totalVolume, totalFees);
    }

    function getPoolConfig() external view returns (address, address, uint256) {
        return (owner, treasury, cap);
    }

    function isOwner(address addr) public view returns (bool) {
        return addr == owner || _owners[addr];
    }

    function isSponsor(address addr) external view returns (bool) {
        return _sponsors[addr];
    }
}
