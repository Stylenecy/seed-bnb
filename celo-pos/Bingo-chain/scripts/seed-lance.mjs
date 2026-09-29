// One-shot: prep the Bingo pool for a LANCE-staked competition.
//  1. Select pool wallets that already hold gas (>= MINGAS CELO) from the prior run.
//  2. Mint enough $LANCE to the deployer via the LanceHub ERC4626 vault (deposit CELO
//     at NAV — does NOT raise NAV, backed mint).
//  3. Transfer STAKE_LANCE $LANCE to each selected wallet (so it can stake).
//  4. Rewrite pool.json to EXACTLY the selected wallets, so competition's shuffle+slice
//     only ever picks funded+LANCE'd wallets. Old 73-pool already backed up.
//
// Env: MINGAS=0.4  STAKE_LANCE=10  PRIZE_BUFFER=60
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const CLAUDELANCE = join(__dir, "..", "..", "Claudelance");
const require = createRequire(join(CLAUDELANCE, "packages/sdk/package.json"));
const { createPublicClient, createWalletClient, http, parseEther, formatEther, parseGwei, getAddress } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { celo } = require("viem/chains");

const RPC = "https://forno.celo.org";
const CELO = getAddress("0x471EcE3750Da237f93B8E339c536989b8978a438");
const HUB = getAddress("0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2"); // LanceHub == $LANCE share token
const MINGAS = parseEther(process.env.MINGAS || "0.4");
const STAKE_LANCE = parseEther(process.env.STAKE_LANCE || "10");
const PRIZE_BUFFER = parseEther(process.env.PRIZE_BUFFER || "60");
const FEE = { maxFeePerGas: parseGwei("260"), maxPriorityFeePerGas: parseGwei("2") };

const ERC20 = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "t", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
];
const VAULT = [
  { type: "function", name: "asset", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "previewMint", stateMutability: "view", inputs: [{ name: "shares", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "shares", type: "uint256" }, { name: "receiver", type: "address" }], outputs: [{ type: "uint256" }] },
];

const deployerKey = readFileSync(join(CLAUDELANCE, "contracts/.env"), "utf8").match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim();
const deployer = privateKeyToAccount(deployerKey.startsWith("0x") ? deployerKey : `0x${deployerKey}`);
const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const wallet = createWalletClient({ account: deployer, chain: celo, transport: http(RPC) });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const lance = (a) => pub.readContract({ address: HUB, abi: ERC20, functionName: "balanceOf", args: [a] });
const wait = (h) => pub.waitForTransactionReceipt({ hash: h, timeout: 180000 });

async function main() {
  const poolFile = join(__dir, "out", "pool.json");
  const all = JSON.parse(readFileSync(poolFile, "utf8")).map((p) => ({ pk: p.pk, account: privateKeyToAccount(p.pk.startsWith("0x") ? p.pk : `0x${p.pk}`) }));

  // 1. select wallets that already hold gas
  const funded = [];
  for (const w of all) { if ((await pub.getBalance({ address: w.account.address })) >= MINGAS) funded.push(w); }
  log(`selected ${funded.length}/${all.length} wallets with >= ${formatEther(MINGAS)} CELO gas`);
  if (funded.length < 2) throw new Error("need >= 2 funded wallets");

  // 2. mint enough $LANCE: funded*STAKE + buffer (for prizes). Backed deposit at NAV.
  const need = STAKE_LANCE * BigInt(funded.length) + PRIZE_BUFFER;
  const have = await lance(deployer.address);
  log(`deployer LANCE ${formatEther(have)} | need ~${formatEther(need)} (${funded.length}x${formatEther(STAKE_LANCE)} + ${formatEther(PRIZE_BUFFER)} prize buffer)`);
  if (have < need) {
    const asset = await pub.readContract({ address: HUB, abi: VAULT, functionName: "asset" });
    if (getAddress(asset) !== CELO) throw new Error(`vault asset is ${asset}, expected CELO`);
    const shortfall = need - have;
    const assetsNeeded = await pub.readContract({ address: HUB, abi: VAULT, functionName: "previewMint", args: [shortfall] });
    const assetsApprove = (assetsNeeded * 102n) / 100n; // 2% headroom
    log(`minting ${formatEther(shortfall)} LANCE for ~${formatEther(assetsNeeded)} CELO (approve ${formatEther(assetsApprove)})`);
    await wait(await wallet.writeContract({ address: CELO, abi: ERC20, functionName: "approve", args: [HUB, assetsApprove], gas: 80000n, ...FEE }));
    await wait(await wallet.writeContract({ address: HUB, abi: VAULT, functionName: "mint", args: [shortfall, deployer.address], gas: 200000n, ...FEE }));
    const after = await lance(deployer.address);
    log(`minted — deployer LANCE now ${formatEther(after)}`);
    if (after < need) throw new Error(`mint short: have ${formatEther(after)} < need ${formatEther(need)}`);
  }

  // 3. transfer STAKE_LANCE to each funded wallet (skip those already topped)
  let nonce = await pub.getTransactionCount({ address: deployer.address });
  const hashes = [];
  for (const w of funded) {
    const b = await lance(w.account.address);
    if (b >= STAKE_LANCE) continue;
    hashes.push(await wallet.writeContract({ address: HUB, abi: ERC20, functionName: "transfer", args: [w.account.address, STAKE_LANCE - b], gas: 80000n, nonce: nonce++, ...FEE }));
  }
  let ok = 0;
  for (const h of hashes) { if ((await wait(h)).status === "success") ok++; }
  log(`transferred LANCE to ${ok}/${hashes.length} wallets (rest already had >= ${formatEther(STAKE_LANCE)})`);

  // verify every funded wallet now holds the stake
  let allHave = true;
  for (const w of funded) { if ((await lance(w.account.address)) < STAKE_LANCE) { allHave = false; log(`  WARN ${w.account.address} short on LANCE`); } }
  if (!allHave) throw new Error("not all funded wallets reached the stake — aborting before pool rewrite");

  // 4. rewrite pool.json to exactly the funded set
  writeFileSync(poolFile, JSON.stringify(funded.map((w) => ({ pk: w.pk })), null, 2));
  log(`pool.json rewritten to ${funded.length} funded+LANCE'd wallets — ready for competition (STAKE_TOKEN=LANCE)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
