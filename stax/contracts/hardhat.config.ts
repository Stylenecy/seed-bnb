import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "cancun", // BSC supports Cancun opcodes (mcopy/tstore) since the Tycho hardfork; required by OZ 5.6
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    bsc: {
      url: process.env.BSC_RPC_URL ?? "https://bsc-dataseed.bnbchain.org",
      chainId: 56,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  // Etherscan V2: ONE API key verifies across chains (BscScan is served by the V2 endpoint).
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ?? "",
    customChains: [
      {
        network: "bsc",
        chainId: 56,
        urls: { apiURL: "https://api.etherscan.io/v2/api", browserURL: "https://bscscan.com" },
      },
      {
        network: "bscTestnet",
        chainId: 97,
        urls: { apiURL: "https://api.etherscan.io/v2/api", browserURL: "https://testnet.bscscan.com" },
      },
    ],
  },
};

export default config;
