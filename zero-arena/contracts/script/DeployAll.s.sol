// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentCertificate} from "../src/AgentCertificate.sol";
import {ReencryptionOracle} from "../src/oracle/ReencryptionOracle.sol";
import {ZeroArenaINFT} from "../src/ZeroArenaINFT.sol";

/// @notice Deploys the three Zero Arena qualifier contracts (AgentCertificate,
///         ReencryptionOracle, ZeroArenaINFT) and writes the addresses to
///         `deployments/<chainId>.json`. Same script targets BSC testnet
///         (97) and BSC mainnet (56) — the output filename is keyed on
///         `block.chainid` so deployments don't overwrite each other.
///
///   # BSC mainnet (56):
///   forge script script/DeployAll.s.sol:DeployAll \
///     --rpc-url $BSC_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY \
///     --broadcast
///
///   # BSC testnet (97) — default target:
///   forge script script/DeployAll.s.sol:DeployAll \
///     --rpc-url $BSC_TESTNET_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY \
///     --broadcast
contract DeployAll is Script {
    function run() external {
        address admin = vm.envAddress("DEPLOYER_ADDRESS");
        address oracleSigner = vm.envAddress("ORACLE_SIGNER_ADDRESS");

        vm.startBroadcast();

        AgentCertificate cert = new AgentCertificate(admin);
        ReencryptionOracle oracle = new ReencryptionOracle(admin, oracleSigner);
        ZeroArenaINFT inft = new ZeroArenaINFT(admin, address(oracle), address(cert));

        vm.stopBroadcast();

        console2.log("chainId:             ", block.chainid);
        console2.log("AgentCertificate:    ", address(cert));
        console2.log("ReencryptionOracle:  ", address(oracle));
        console2.log("ZeroArenaINFT:       ", address(inft));

        string memory json = string.concat(
            '{\n  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "addresses": {\n',
            '    "AgentCertificate": "',    vm.toString(address(cert)),   '",\n',
            '    "ReencryptionOracle": "',  vm.toString(address(oracle)), '",\n',
            '    "ZeroArenaINFT": "',       vm.toString(address(inft)),   '"\n',
            '  },\n',
            '  "deployBlock": ', vm.toString(block.number), '\n}\n'
        );
        string memory outPath = string.concat(
            "deployments/", vm.toString(block.chainid), ".json"
        );
        vm.writeFile(outPath, json);
        console2.log("wrote:");
        console2.log(outPath);
    }
}
