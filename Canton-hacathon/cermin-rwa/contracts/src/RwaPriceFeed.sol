// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RwaPriceFeed — port of the Daml `Cermin.Oracle:PriceFeed` template.
/// @notice The mock oracle (owner) publishes one price per instrument, scaled to
///         1e18 (1.00 = 1e18). `round` increments on every update — it plays the
///         role of the Daml contract id that changed on each archive+recreate, so
///         the Guard Agent can tell "the same price observation" apart.
contract RwaPriceFeed is Ownable {
    struct Price {
        uint256 price;
        uint64 round;
        uint64 updatedAt;
    }

    mapping(bytes32 instrumentId => Price) private _prices;

    event PriceUpdated(bytes32 indexed instrumentId, uint256 price, uint64 round);

    error InvalidPrice();
    error UnknownInstrument();

    constructor(address oracle_) Ownable(oracle_) {}

    /// @notice Daml `UpdatePrice` (controller oracle). Also used to publish the first price.
    function updatePrice(bytes32 instrumentId, uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        Price storage p = _prices[instrumentId];
        p.price = newPrice;
        p.round += 1;
        p.updatedAt = uint64(block.timestamp);
        emit PriceUpdated(instrumentId, newPrice, p.round);
    }

    function getPrice(bytes32 instrumentId) external view returns (uint256 price, uint64 round, uint64 updatedAt) {
        Price memory p = _prices[instrumentId];
        if (p.price == 0) revert UnknownInstrument();
        return (p.price, p.round, p.updatedAt);
    }
}
