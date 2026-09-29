// $LANCE — the shared economy credit (Lance Hub, ERC-4626 vault, CELO-backed).
// Buy = deposit CELO → mint $LANCE at NAV. Redeem = burn $LANCE → CELO (−fee).
// $LANCE can be used to stake/play BingoChain arenas. See lance-hub/ECONOMY.md.

import type { Address } from "viem";
import { ACTIVE_NETWORK } from "./networks";

// Multichain: Celo mainnet addresses by default; on BNB Chain the pool asset is WBNB.
export const LANCE_ADDRESS: Address = ACTIVE_NETWORK.lance; // Lance Hub proxy (= $LANCE); Celo 0xb70c…5cA2
export const LANCE_ASSET: Address = ACTIVE_NETWORK.lanceAsset; // CELO ERC20 on Celo, WBNB on BSC (pool asset)
export const LANCE_ASSET_SYMBOL = ACTIVE_NETWORK.lanceAssetSymbol;
export const LANCE_DECIMALS = 18;

export const lanceAbi = [
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }], outputs: [{ name: "shares", type: "uint256" }] },
  { type: "function", name: "redeem", stateMutability: "nonpayable", inputs: [{ name: "shares", type: "uint256" }, { name: "receiver", type: "address" }, { name: "owner", type: "address" }], outputs: [{ name: "assets", type: "uint256" }] },
  { type: "function", name: "nav", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "redeemFeeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;
