// Final-batch seed: GENERATE COUNT brand-new unique wallets (distinct from any
// prior batch), write them to pool.json, mint $LANCE if needed, airdrop STAKE_LANCE
// to each. competition then funds their gas + plays. Saves pks to pool.json so the
// gas is recoverable via pool-skim afterward. Env: COUNT=49 STAKE_LANCE=10 PRIZE_BUFFER=60
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const CLAUDELANCE = join(__dir, "..", "..", "Claudelance");
const require = createRequire(join(CLAUDELANCE, "packages/sdk/package.json"));
const { createPublicClient, createWalletClient, http, parseEther, formatEther, parseGwei, getAddress } = require("viem");
const { privateKeyToAccount, generatePrivateKey } = require("viem/accounts");
const { celo } = require("viem/chains");

const RPC = "https://forno.celo.org";
const CELO = getAddress("0x471EcE3750Da237f93B8E339c536989b8978a438");
const HUB = getAddress("0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2");
const COUNT = Number(process.env.COUNT || 49);
const STAKE_LANCE = parseEther(process.env.STAKE_LANCE || "10");
const PRIZE_BUFFER = parseEther(process.env.PRIZE_BUFFER || "60");
const FEE = { maxFeePerGas: parseGwei("260"), maxPriorityFeePerGas: parseGwei("2") };

const ERC20 = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "t", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
];
const VAULT = [
  { type: "function", name: "previewMint", stateMutability: "view", inputs: [{ name: "s", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "s", type: "uint256" }, { name: "r", type: "address" }], outputs: [{ type: "uint256" }] },
];

const deployerKey = readFileSync(join(CLAUDELANCE, "contracts/.env"), "utf8").match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim();
const deployer = privateKeyToAccount(deployerKey.startsWith("0x") ? deployerKey : `0x${deployerKey}`);
const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const wallet = createWalletClient({ account: deployer, chain: celo, transport: http(RPC) });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const lance = (a) => pub.readContract({ address: HUB, abi: ERC20, functionName: "balanceOf", args: [a] });
const wait = (h) => pub.waitForTransactionReceipt({ hash: h, timeout: 180000 });

async function main() {
  const outDir = join(__dir, "out");
  // generate COUNT brand-new wallets
  const fresh = Array.from({ length: COUNT }, () => { const pk = generatePrivateKey(); return { pk, account: privateKeyToAccount(pk) }; });
  log(`generated ${fresh.length} brand-new wallets`);
  // write pool.json now (before any funding) so funds are always recoverable
  writeFileSync(join(outDir, "pool.json"), JSON.stringify(fresh.map((w) => ({ pk: w.pk })), null, 2));

  // mint LANCE if short
  const need = STAKE_LANCE * BigInt(fresh.length) + PRIZE_BUFFER;
  const have = await lance(deployer.address);
  log(`deployer LANCE ${formatEther(have)} | need ~${formatEther(need)}`);
  if (have < need) {
    const shortfall = need - have;
    const assets = await pub.readContract({ address: HUB, abi: VAULT, functionName: "previewMint", args: [shortfall] });
    log(`minting ${formatEther(shortfall)} LANCE for ~${formatEther(assets)} CELO`);
    await wait(await wallet.writeContract({ address: CELO, abi: ERC20, functionName: "approve", args: [HUB, (assets * 102n) / 100n], gas: 80000n, ...FEE }));
    await wait(await wallet.writeContract({ address: HUB, abi: VAULT, functionName: "mint", args: [shortfall, deployer.address], gas: 200000n, ...FEE }));
    log(`minted — deployer LANCE now ${formatEther(await lance(deployer.address))}`);
  }

  // airdrop STAKE_LANCE to each (sequential — viem auto-nonce, avoids forno stale-nonce)
  let ok = 0;
  for (const w of fresh) {
    const h = await wallet.writeContract({ address: HUB, abi: ERC20, functionName: "transfer", args: [w.account.address, STAKE_LANCE], gas: 80000n, ...FEE });
    if ((await wait(h)).status === "success") ok++;
    if (ok % 10 === 0) log(`  airdropped ${ok}/${fresh.length}`);
  }
  log(`airdropped LANCE to ${ok}/${fresh.length} fresh wallets`);
  for (const w of fresh) if ((await lance(w.account.address)) < STAKE_LANCE) throw new Error(`${w.account.address} short on LANCE`);
  log(`pool.json := ${fresh.length} fresh+LANCE'd wallets — ready for final competition batch`);
}
main().then(() => process.exit(0)).catch((e) => { console.error("FINAL-SEED ERR:", e.shortMessage || e.message); process.exit(1); });
