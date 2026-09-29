// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { ERC4626Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title LanceHub — the $LANCE internal economy token + Redemption Pool
/// @notice $LANCE is a cheap, closed-loop credits token (NOT a listed/market token).
///         It is an ERC-4626 vault share: the asset is CELO held in the Redemption
///         Pool, and the on-chain rate (NAV) = pool ÷ supply.
///
///         Bootstrapped cheap: the one-time seed mints SEED_RATE (1000) $LANCE per
///         CELO, so 1 $LANCE ≈ 0.001 CELO — cheap enough to hand out for play/testing.
///
///         - deposit CELO            → mint $LANCE at the current NAV (fair, no dilution)
///         - redeem $LANCE           → CELO at NAV minus a small redeem fee; the fee
///                                     stays in the pool, lifting NAV for everyone left
///         - fundPool(CELO)          → revenue/backing in WITHOUT minting → NAV rises
///         - "Earn" = deposit(assets, earner): a rewarder funds the reward in CELO and
///                                     mints to the earner at NAV → NAV-neutral (sink ≥ faucet)
///
///         Games (BingoChain, future games) and Claudelance route revenue here via
///         fundPool, so all $LANCE holders share in ecosystem growth. UUPS-upgradeable,
///         owner is a Safe multisig.
contract LanceHub is Initializable, ERC4626Upgradeable, Ownable2StepUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    using Math for uint256;
    using SafeERC20 for IERC20;

    uint16 public constant BPS = 10_000;
    uint16 public constant MAX_REDEEM_FEE_BPS = 500; // hard cap 5%
    uint256 public constant SEED_RATE = 1000; // whole $LANCE minted per 1 whole CELO at seed → NAV starts at 1/1000

    /// @custom:storage-location erc7201:lancehub.main
    struct MainStorage {
        uint16 redeemFeeBps;
        bool seeded;
    }
    // keccak256(abi.encode(uint256(keccak256("lancehub.main")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant MAIN_STORAGE_SLOT = 0xc5668f232dee115dddaf2002b6ffdfc37a905dfc6b2e0c760fcabee8b6846500;

    function _main() private pure returns (MainStorage storage s) {
        assembly {
            s.slot := MAIN_STORAGE_SLOT
        }
    }

    event PoolFunded(address indexed from, uint256 assets);
    event RedeemFeeUpdated(uint16 oldBps, uint16 newBps);
    event Seeded(address indexed by, uint256 assets, uint256 shares);

    error FeeTooHigh(uint16 bps);
    error ZeroAddress();
    error AlreadySeeded();
    error NotSeeded();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param assetToken The pool asset (CELO ERC20). @param owner_ Safe multisig.
    function initialize(IERC20 assetToken, address owner_, uint16 redeemFeeBps_) external initializer {
        if (address(assetToken) == address(0) || owner_ == address(0)) revert ZeroAddress();
        if (redeemFeeBps_ > MAX_REDEEM_FEE_BPS) revert FeeTooHigh(redeemFeeBps_);
        __ERC20_init("Lance", "LANCE");
        __ERC4626_init(assetToken);
        __Ownable_init(owner_);
        __Pausable_init();
        __UUPSUpgradeable_init();
        _main().redeemFeeBps = redeemFeeBps_;
    }

    function _authorizeUpgrade(address) internal override onlyOwner { }

    // ─────────────────────────── one-time seed ───────────────────────────
    // Bootstraps the vault at the fixed cheap rate: `assets` CELO → assets * SEED_RATE
    // whole $LANCE, setting initial NAV = 1/SEED_RATE CELO per $LANCE. The rate is a
    // hardcoded constant, so it is safe to leave permissionless — the seeder simply
    // pays CELO for backed shares. Deposits are gated until seeded (so nobody can set
    // a 1:1 rate first), and the large minted supply neutralizes the ERC-4626
    // inflation/donation attack (no dead-shares trick needed).
    function seed(uint256 assets) external {
        MainStorage storage s = _main();
        if (s.seeded) revert AlreadySeeded();
        s.seeded = true;
        IERC20(asset()).safeTransferFrom(_msgSender(), address(this), assets);
        _mint(_msgSender(), assets * SEED_RATE);
        emit Seeded(_msgSender(), assets, assets * SEED_RATE);
    }

    function seeded() external view returns (bool) {
        return _main().seeded;
    }

    // ─────────────────────────── redeem fee ───────────────────────────
    // The fee is withheld in the vault (not paid out, not transferred): shares are
    // fully burned but only the net leaves, so the withheld CELO lifts NAV for the
    // remaining holders. That is the "healthy friction" — exits subsidize stayers.

    function redeemFeeBps() public view returns (uint16) {
        return _main().redeemFeeBps;
    }

    function _feeOnRedeem(uint256 grossAssets) internal view returns (uint256) {
        return grossAssets.mulDiv(_main().redeemFeeBps, BPS, Math.Rounding.Ceil);
    }

    /// @dev Net assets a redeemer receives for `shares` (gross − fee).
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        uint256 gross = super.previewRedeem(shares);
        return gross - _feeOnRedeem(gross);
    }

    /// @dev Shares burned to withdraw `assets` net (extra shares cover the fee).
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        uint256 fee = _main().redeemFeeBps;
        uint256 gross = assets.mulDiv(BPS, BPS - fee, Math.Rounding.Ceil);
        return super.previewWithdraw(gross);
    }

    function maxWithdraw(address owner_) public view override returns (uint256) {
        uint256 gross = super.maxWithdraw(owner_);
        return gross - _feeOnRedeem(gross);
    }

    // ───────────────────── revenue / backing intake ─────────────────────

    /// @notice Add CELO to the pool WITHOUT minting shares: lifts NAV for all
    ///         holders. This is how games + Claudelance route revenue/backing in.
    function fundPool(uint256 assets) external {
        IERC20(asset()).safeTransferFrom(_msgSender(), address(this), assets);
        emit PoolFunded(_msgSender(), assets);
    }

    // ─────────────────────────────── views ───────────────────────────────

    /// @notice CELO value of one whole $LANCE (1e18-scaled) — the on-chain rate.
    function nav() external view returns (uint256) {
        return convertToAssets(10 ** decimals());
    }

    // ─────────────────────────────── admin ───────────────────────────────

    function setRedeemFee(uint16 newBps) external onlyOwner {
        if (newBps > MAX_REDEEM_FEE_BPS) revert FeeTooHigh(newBps);
        emit RedeemFeeUpdated(_main().redeemFeeBps, newBps);
        _main().redeemFeeBps = newBps;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Pause gates vault entry/exit only; plain $LANCE transfers stay live because
    // games need to move stakes while a deposit freeze is in effect.
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares)
        internal
        override
        whenNotPaused
    {
        if (!_main().seeded) revert NotSeeded();
        super._deposit(caller, receiver, assets, shares);
    }

    function _withdraw(address caller, address receiver, address owner_, uint256 assets, uint256 shares)
        internal
        override
        whenNotPaused
    {
        super._withdraw(caller, receiver, owner_, assets, shares);
    }
}
