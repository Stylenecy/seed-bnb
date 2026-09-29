// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title EquinoxRegistry
/// @notice Protocol registry + access control. Port of `equinox::registry` and
///         `equinox::access` (Sui Move).
///
///         Sui capabilities map to OpenZeppelin roles:
///           AdminCap  -> DEFAULT_ADMIN_ROLE
///           AgentCap  -> AGENT_ROLE   (off-chain executor, revocable)
///           OracleCap -> ORACLE_ROLE  (price keeper, revocable)
///
///         A "venue" is a (protocol, pool) choice, e.g. `native-usdt`,
///         `venus-usdt`. Each venue points to an `IStrategyAdapter` contract.
contract EquinoxRegistry is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("EQUINOX_AGENT_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("EQUINOX_ORACLE_ROLE");

    /// Venue kinds (Sui: NATIVE / SCALLOP / NAVI -> BNB Chain: NATIVE / VENUS / EXTERNAL).
    uint8 public constant VENUE_NATIVE = 0;
    uint8 public constant VENUE_VENUS = 1;
    uint8 public constant VENUE_EXTERNAL = 2;

    struct VenueConfig {
        uint8 kind;
        bool enabled;
        bool exists;
        /// IStrategyAdapter the vault calls to deploy/redeem.
        address adapter;
        /// Primary external contract (e.g. Venus vToken). address(0) for NATIVE.
        address pool;
    }

    struct AssetConfig {
        uint16 maxLtvBps;
        uint16 liqThresholdBps;
        uint8 decimals;
        bool enabled;
        bool exists;
        /// Chainlink AggregatorV3 USD feed (address(0) = keeper-push only).
        address priceFeed;
    }

    error VenueExists();
    error VenueMissing();
    error VenueDisabled();
    error AssetExists();
    error AssetMissing();
    error AssetDisabled();
    error Paused();
    error BadParams();

    event VenueRegistered(string venue, uint8 kind, address adapter, address pool);
    event VenueEnabled(string venue, bool enabled);
    event AssetRegistered(address indexed token, uint16 maxLtvBps, uint16 liqThresholdBps, uint8 decimals);
    event AssetEnabled(address indexed token, bool enabled);
    event PausedSet(bool paused);

    mapping(string => VenueConfig) private _venues;
    mapping(address => AssetConfig) private _assets;
    bool public paused;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // === Admin: venues ===

    function registerVenue(uint8 kind, string calldata name, address adapter, address pool)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (kind > VENUE_EXTERNAL || adapter == address(0)) revert BadParams();
        if (_venues[name].exists) revert VenueExists();
        _venues[name] = VenueConfig({kind: kind, enabled: true, exists: true, adapter: adapter, pool: pool});
        emit VenueRegistered(name, kind, adapter, pool);
    }

    function setVenueEnabled(string calldata name, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!_venues[name].exists) revert VenueMissing();
        _venues[name].enabled = enabled;
        emit VenueEnabled(name, enabled);
    }

    // === Admin: assets ===

    function registerAsset(
        address token,
        uint16 maxLtv,
        uint16 liqThreshold,
        uint8 decimals_,
        address feed
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!(maxLtv <= liqThreshold && liqThreshold <= 10_000)) revert BadParams();
        if (_assets[token].exists) revert AssetExists();
        _assets[token] = AssetConfig({
            maxLtvBps: maxLtv,
            liqThresholdBps: liqThreshold,
            decimals: decimals_,
            enabled: true,
            exists: true,
            priceFeed: feed
        });
        emit AssetRegistered(token, maxLtv, liqThreshold, decimals_);
    }

    function setAssetEnabled(address token, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!_assets[token].exists) revert AssetMissing();
        _assets[token].enabled = enabled;
        emit AssetEnabled(token, enabled);
    }

    function setPaused(bool _paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = _paused;
        emit PausedSet(_paused);
    }

    // === Views ===

    function venue(string calldata name) external view returns (VenueConfig memory v) {
        v = _venues[name];
        if (!v.exists) revert VenueMissing();
    }

    function hasVenue(string calldata name) external view returns (bool) {
        return _venues[name].exists;
    }

    function isVenueEnabled(string calldata name) external view returns (bool) {
        return _venues[name].exists && _venues[name].enabled;
    }

    function asset(address token) public view returns (AssetConfig memory a) {
        a = _assets[token];
        if (!a.exists) revert AssetMissing();
    }

    function hasAsset(address token) external view returns (bool) {
        return _assets[token].exists;
    }

    function maxLtvBps(address token) external view returns (uint256) {
        return asset(token).maxLtvBps;
    }

    function liqThresholdBps(address token) external view returns (uint256) {
        return asset(token).liqThresholdBps;
    }

    function assetDecimals(address token) external view returns (uint8) {
        return asset(token).decimals;
    }

    function priceFeed(address token) external view returns (address) {
        return asset(token).priceFeed;
    }

    // === Guards ===

    function assertNotPaused() external view {
        if (paused) revert Paused();
    }

    /// Returns the adapter of an enabled venue (reverts otherwise).
    function assertVenueEnabled(string calldata name) external view returns (address adapter) {
        VenueConfig storage v = _venues[name];
        if (!v.exists) revert VenueMissing();
        if (!v.enabled) revert VenueDisabled();
        return v.adapter;
    }

    function assertAssetEnabled(address token) external view {
        AssetConfig storage a = _assets[token];
        if (!a.exists) revert AssetMissing();
        if (!a.enabled) revert AssetDisabled();
    }
}
