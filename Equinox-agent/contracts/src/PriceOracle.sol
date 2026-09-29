// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EquinoxRegistry} from "./EquinoxRegistry.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";

/// @title PriceOracle
/// @notice USD price cache for cross-asset valuation. Port of `equinox::oracle`.
///
///         Two write paths (same as on Sui, with Pyth replaced by Chainlink):
///         1. Keeper push: an ORACLE_ROLE holder calls `setPrice` (8-dp USD).
///         2. Trustless: anyone calls `refreshFromChainlink(token, maxAgeSecs)`,
///            which reads the asset's Chainlink AggregatorV3 feed (configured in
///            the registry) and normalizes it to 8 dp.
///
///         Staleness is measured in SECONDS (`block.timestamp`), where the Move
///         version used Sui Clock milliseconds.
contract PriceOracle {
    uint8 public constant PRICE_DECIMALS = 8;

    struct PriceEntry {
        uint256 price8dp;
        uint64 publishedAt;
    }

    error NotOracle();
    error Stale();
    error Missing();
    error NoFeed();
    error BadAnswer();

    event PriceSet(address indexed token, uint256 price8dp, uint256 publishedAt, bool fromChainlink);

    EquinoxRegistry public immutable registry;
    mapping(address => PriceEntry) public prices;

    constructor(EquinoxRegistry _registry) {
        registry = _registry;
    }

    // === Writing prices ===

    function setPrice(address token, uint256 price8dp) external {
        if (!registry.hasRole(registry.ORACLE_ROLE(), msg.sender)) revert NotOracle();
        _write(token, price8dp, false);
    }

    /// Permissionless: pull the latest Chainlink answer for `token` into the cache.
    function refreshFromChainlink(address token, uint256 maxAgeSecs) external {
        address feed = registry.priceFeed(token);
        if (feed == address(0)) revert NoFeed();
        (, int256 answer,, uint256 updatedAt,) = AggregatorV3Interface(feed).latestRoundData();
        if (answer <= 0) revert BadAnswer();
        if (block.timestamp > updatedAt + maxAgeSecs) revert Stale();
        uint8 feedDecimals = AggregatorV3Interface(feed).decimals();
        _write(token, normalize(uint256(answer), feedDecimals), true);
    }

    function _write(address token, uint256 price8dp, bool fromChainlink) internal {
        prices[token] = PriceEntry({price8dp: price8dp, publishedAt: uint64(block.timestamp)});
        emit PriceSet(token, price8dp, block.timestamp, fromChainlink);
    }

    // === Reading prices ===

    /// USD price (8 dp). Reverts if missing or older than `maxAgeSecs`.
    function priceOf(address token, uint256 maxAgeSecs) public view returns (uint256) {
        PriceEntry memory e = prices[token];
        if (e.publishedAt == 0) revert Missing();
        if (block.timestamp > uint256(e.publishedAt) + maxAgeSecs) revert Stale();
        return e.price8dp;
    }

    function hasPrice(address token) external view returns (bool) {
        return prices[token].publishedAt != 0;
    }

    /// USD value (8 dp) of `amount` of `token` with `decimals`.
    function usdValue(address token, uint256 amount, uint8 decimals, uint256 maxAgeSecs)
        public
        view
        returns (uint256)
    {
        return (amount * priceOf(token, maxAgeSecs)) / (10 ** decimals);
    }

    /// Inverse of `usdValue`: units of `token` worth `usd8dp`.
    function amountFromUsd(address token, uint256 usd8dp, uint8 decimals, uint256 maxAgeSecs)
        public
        view
        returns (uint256)
    {
        return (usd8dp * (10 ** decimals)) / priceOf(token, maxAgeSecs);
    }

    /// Normalize a price with `feedDecimals` decimals to 8 dp (replaces `from_pyth`).
    function normalize(uint256 answer, uint8 feedDecimals) public pure returns (uint256) {
        if (feedDecimals == PRICE_DECIMALS) return answer;
        if (feedDecimals < PRICE_DECIMALS) return answer * 10 ** (PRICE_DECIMALS - feedDecimals);
        return answer / 10 ** (feedDecimals - PRICE_DECIMALS);
    }
}
