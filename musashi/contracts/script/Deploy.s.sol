// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ConvictionLog.sol";
import "../src/MusashiINFT.sol";

// Deploys the UUPS-upgradeable stack. For each contract: deploy the
// implementation, then an ERC1967 proxy initialized in the same tx. The PROXY
// addresses are the canonical ConvictionLog / MusashiINFT addresses — put those
// in .env (the implementations are never called directly).
//
// BNB Chain (BSC testnet 97 / mainnet 56):
//   forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast \
//     --verify --etherscan-api-key $ETHERSCAN_API_KEY
// script/deploy-and-verify.sh performs the same sequence with `forge create` + `cast`
// and additionally asserts receipts and writes the proxy addresses into .env.
contract DeployMusashi is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("BSC_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // ── ConvictionLog: implementation + proxy(initialize()) ──
        address clImpl = address(new ConvictionLog());
        ConvictionLog convictionLog = ConvictionLog(
            address(new ERC1967Proxy(clImpl, abi.encodeCall(ConvictionLog.initialize, ())))
        );

        // ── MusashiINFT: implementation + proxy(initialize(convictionLog)) ──
        address inftImpl = address(new MusashiINFT());
        MusashiINFT inft = MusashiINFT(
            address(
                new ERC1967Proxy(inftImpl, abi.encodeCall(MusashiINFT.initialize, (address(convictionLog))))
            )
        );

        // ── Link + oracle (hackathon: deployer doubles as the re-encryption oracle) ──
        convictionLog.setINFT(address(inft));
        inft.setOracle(vm.addr(deployerPrivateKey));

        vm.stopBroadcast();

        console.log("ConvictionLog impl :", clImpl);
        console.log("ConvictionLog proxy:", address(convictionLog));
        console.log("MusashiINFT  impl  :", inftImpl);
        console.log("MusashiINFT  proxy :", address(inft));
        console.log("");
        console.log("=== SAVE THESE (proxy addresses) ===");
        console.log("CONVICTION_LOG_ADDRESS=%s", address(convictionLog));
        console.log("MUSASHI_INFT_ADDRESS=%s", address(inft));
    }
}
