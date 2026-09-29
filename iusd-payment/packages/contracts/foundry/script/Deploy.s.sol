// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPayPool} from "../src/IPayPool.sol";
import {IPayGiftPool} from "../src/IPayGiftPool.sol";
import {MockERC20} from "../src/MockERC20.sol";

/// @dev Deploy iUSD Pay to BNB Smart Chain.
///
///   Testnet (97), deploys a MockERC20 "USDT" unless TOKEN_ADDRESS is set:
///     forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast --private-key $DEPLOYER_PK
///   Mainnet (56), TOKEN_ADDRESS required (USDT 0x55d398326f99059fF775485246999027B3197955):
///     TOKEN_ADDRESS=0x55d3... forge script script/Deploy.s.sol --rpc-url bsc --broadcast --private-key $DEPLOYER_PK
///
///   Optional env: PAY_FEE_BPS (default 0), PAY_FEE_CAP (default 0), RELAYER_ADDRESS (added as sponsor on both pools).
contract Deploy is Script {
    function run() external {
        require(block.chainid == 56 || block.chainid == 97 || block.chainid == 31337, "Deploy: expected BSC 56/97");
        address tokenAddr = vm.envOr("TOKEN_ADDRESS", address(0));
        uint256 feeBps = vm.envOr("PAY_FEE_BPS", uint256(0));
        uint256 feeCap = vm.envOr("PAY_FEE_CAP", uint256(0));
        address relayer = vm.envOr("RELAYER_ADDRESS", address(0));

        vm.startBroadcast();
        if (tokenAddr == address(0)) {
            require(block.chainid != 56, "Deploy: TOKEN_ADDRESS required on mainnet");
            tokenAddr = address(new MockERC20("Mock USDT", "USDT"));
        }
        IPayPool pay = new IPayPool(IERC20(tokenAddr), feeBps, feeCap);
        IPayGiftPool gift = new IPayGiftPool(IERC20(tokenAddr));
        if (relayer != address(0)) {
            pay.addSponsor(relayer);
            gift.addSponsor(relayer);
        }
        vm.stopBroadcast();

        console.log("TOKEN_ADDRESS     ", tokenAddr);
        console.log("IPAY_POOL_ADDRESS ", address(pay));
        console.log("GIFT_POOL_ADDRESS ", address(gift));
    }
}
