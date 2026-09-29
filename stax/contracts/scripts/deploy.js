const hre = require("hardhat");

// --- BNB Chain deploy (BSC testnet 97 default via `npm run deploy:testnet`, mainnet 56 via `deploy:bsc`) ---
// Everything chain-specific comes from env (see .env.example). No address is guessed.
const MAINNET_USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // Binance-Peg USDC (18 dec)
const PANCAKE_V3_SWAP_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14"; // BSC mainnet + testnet

const AGENT_CARD = process.env.AGENT_CARD_URI || "https://www.stax.best/.well-known/agent-card.json";

const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

async function main() {
  const agentSigner = process.env.AGENT_SIGNER_ADDRESS;
  if (!agentSigner) throw new Error("AGENT_SIGNER_ADDRESS not set in .env");

  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();
  const me = deployer.account.address;
  const chainId = await publicClient.getChainId();
  console.log(`Network: ${hre.network.name} (chainId ${chainId})`);
  console.log(`Deployer: ${me}`);
  console.log(`Agent signer: ${agentSigner}\n`);

  // 0) Settlement stablecoin (18 decimals on BSC).
  let stable = process.env.STABLE_ADDRESS;
  if (!stable) {
    if (chainId === 56) {
      stable = MAINNET_USDC;
    } else {
      // Testnet / local: deploy an 18-dec mock so the flow is testable end to end.
      const mock = await hre.viem.deployContract("MockERC20", ["Mock USDC", "USDC"]);
      stable = mock.address;
      console.log(`MockERC20 (USDC, 18 dec): ${stable}`);
    }
  }
  const router = process.env.DEX_ROUTER || PANCAKE_V3_SWAP_ROUTER;
  const assets = list(process.env.ASSET_TOKENS);

  // 1) InferenceVerifier — the EIP-712 risk-inference gate.
  const verifier = await hre.viem.deployContract("InferenceVerifier", [agentSigner]);
  console.log(`InferenceVerifier: ${verifier.address}`);

  // 2) IdentityRegistry — ERC-8004-style agent identity; register the Stax agent.
  const registry = await hre.viem.deployContract("IdentityRegistry", []);
  console.log(`IdentityRegistry:  ${registry.address}`);
  await publicClient.waitForTransactionReceipt({ hash: await registry.write.register([me, AGENT_CARD]) });
  const agentId = (await registry.read.nextAgentId()) - 1n;
  console.log(`Stax agent registered → agentId ${agentId}`);

  // 3) StaxExecutor — commit + verify + non-custodial PancakeSwap execution.
  const executor = await hre.viem.deployContract("StaxExecutor", [stable, verifier.address]);
  console.log(`StaxExecutor:      ${executor.address}`);
  const deployBlock = await publicClient.getBlockNumber();

  // 4) Whitelist the router + asset tokens (wait for each receipt on a live chain).
  await publicClient.waitForTransactionReceipt({ hash: await executor.write.setRouter([router, true]) });
  console.log(`Whitelisted router ${router}`);
  if (assets.length) {
    await publicClient.waitForTransactionReceipt({ hash: await executor.write.setAssets([assets, true]) });
    console.log(`Whitelisted ${assets.length} asset tokens`);
  } else {
    console.log("TODO: no ASSET_TOKENS set — whitelist BSC asset tokens later with scripts/enable-assets.js");
  }

  console.log("\n=== Deployment summary (paste into web/.env.local) ===");
  console.log(
    JSON.stringify(
      {
        network: hre.network.name,
        NEXT_PUBLIC_CHAIN_ID: String(chainId),
        NEXT_PUBLIC_USDC_ADDRESS: stable,
        NEXT_PUBLIC_DEX_ROUTER: router,
        NEXT_PUBLIC_INFERENCE_VERIFIER: verifier.address,
        NEXT_PUBLIC_IDENTITY_REGISTRY: registry.address,
        NEXT_PUBLIC_STAX_EXECUTOR: executor.address,
        NEXT_PUBLIC_STAX_EXECUTOR_BLOCK: deployBlock.toString(),
        NEXT_PUBLIC_STAX_AGENT_ID: agentId.toString(),
      },
      null,
      2,
    ),
  );
  console.log(`\nVerify on BscScan (Etherscan V2), e.g.:`);
  console.log(`  npx hardhat verify --network ${hre.network.name} ${verifier.address} ${agentSigner}`);
  console.log(`  npx hardhat verify --network ${hre.network.name} ${executor.address} ${stable} ${verifier.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
