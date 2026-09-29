const hre = require("hardhat");

// Whitelist extra routers + asset tokens on an already-deployed StaxExecutor (BNB Chain).
// All inputs come from env (see .env.example):
//   STAX_EXECUTOR   deployed executor address (required)
//   EXTRA_ROUTERS   comma-separated router addresses (e.g. PancakeSwap V3 SwapRouter)
//   EXTRA_ASSETS    comma-separated token addresses (tokenized stocks, route intermediaries, ...)
// The Mantle-era routes (Agni sUSDe/mETH, Merchant Moe FBTC) do not exist on BSC.
// TODO: pick + validate BSC equivalents (PancakeSwap V3 pools) and pass them here.
//
// Run: npm run enable:testnet   (owner = deployer in .env PRIVATE_KEY)

const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

async function main() {
  const executorAddr = process.env.STAX_EXECUTOR;
  if (!executorAddr) throw new Error("STAX_EXECUTOR not set in .env");
  const routers = list(process.env.EXTRA_ROUTERS);
  const assets = list(process.env.EXTRA_ASSETS);
  if (!routers.length && !assets.length) throw new Error("Nothing to do: set EXTRA_ROUTERS and/or EXTRA_ASSETS");

  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();
  const me = deployer.account.address;
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer (owner): ${me}\n`);

  const executor = await hre.viem.getContractAt("StaxExecutor", executorAddr);
  const owner = await executor.read.owner();
  if (owner.toLowerCase() !== me.toLowerCase()) {
    throw new Error(`Signer ${me} is not the executor owner (${owner}). Aborting.`);
  }

  const txHashes = {};
  for (const r of routers) {
    const h = await executor.write.setRouter([r, true]);
    await publicClient.waitForTransactionReceipt({ hash: h });
    txHashes[`setRouter_${r}`] = h;
    console.log(`setRouter(${r}, true) -> ${h}`);
  }
  if (assets.length) {
    const h = await executor.write.setAssets([assets, true]);
    await publicClient.waitForTransactionReceipt({ hash: h });
    txHashes.setAssets = h;
    console.log(`setAssets([${assets.join(", ")}], true) -> ${h}`);
  }

  const checks = {};
  for (const r of routers) checks[`routerAllowed_${r}`] = await executor.read.routerAllowed([r]);
  for (const a of assets) checks[`assetAllowed_${a}`] = await executor.read.assetAllowed([a]);

  console.log("\n=== Enablement complete ===");
  console.log(JSON.stringify({ txHashes, checks }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
