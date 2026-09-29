// Distribution probe: which player wallets hold cUSD, which workers hold CELO.
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const CL = join(ROOT, "..", "Claudelance");
const require = createRequire(join(CL, "packages/sdk/package.json"));
const { createPublicClient, http, getAddress, formatEther, formatUnits } = require("viem");
const { celo } = require("viem/chains");
const pub = createPublicClient({ chain: celo, transport: http("https://forno.celo.org", { batch: true }) });
const CUSD = getAddress("0x765DE816845861e75A25fCA122bb6898B8B1282a");
const MC3 = getAddress("0xcA11bde05977b3631167028862bE2a173976CA11");
const ERC20 = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }];
const MC3A = [{ type: "function", name: "getEthBalance", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }];
const addrOf = (p) => { const m = readFileSync(p, "utf8").match(/^ADDRESS=(.+)$/m); return m ? getAddress(m[1].trim()) : null; };
const labeled = (base, re) => readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory() && re.test(d.name)).map((d) => ({ name: d.name, addr: addrOf(join(base, d.name, "wallet.env")) })).filter((x) => x.addr);

const players = labeled(join(ROOT, "wallets"), /^player-/);
const workers = labeled(join(CL, "claudelance worker"), /worker/i);

async function balances(list) {
  const contracts = list.flatMap((x) => [
    { address: CUSD, abi: ERC20, functionName: "balanceOf", args: [x.addr] },
    { address: MC3, abi: MC3A, functionName: "getEthBalance", args: [x.addr] },
  ]);
  const r = await pub.multicall({ contracts, allowFailure: true });
  return list.map((x, i) => ({ ...x, cusd: r[2 * i].result ?? 0n, celo: r[2 * i + 1].result ?? 0n }));
}

const pb = (await balances(players)).filter((x) => x.cusd > 0n).sort((a, b) => (b.cusd > a.cusd ? 1 : -1));
const wb = (await balances(workers)).sort((a, b) => (b.celo > a.celo ? 1 : -1));

console.log("=== player wallets holding cUSD (desc) ===");
let cum = 0n;
pb.forEach((x) => { cum += x.cusd; console.log(`${x.name.padEnd(11)} cUSD ${Number(formatUnits(x.cusd, 18)).toFixed(4).padStart(9)}  CELO ${Number(formatEther(x.celo)).toFixed(4).padStart(8)}`); });
console.log(`-> ${pb.length} players hold cUSD, sum ${formatUnits(cum, 18)} cUSD`);
const top10 = pb.slice(0, 10).reduce((s, x) => s + x.cusd, 0n);
console.log(`-> top 10 hold ${formatUnits(top10, 18)} cUSD`);

console.log("\n=== top worker wallets by CELO ===");
wb.slice(0, 8).forEach((x) => console.log(`${x.name.padEnd(11)} CELO ${Number(formatEther(x.celo)).toFixed(4).padStart(8)}  cUSD ${Number(formatUnits(x.cusd, 18)).toFixed(4)}`));
console.log(`-> workers total CELO ${formatEther(wb.reduce((s, x) => s + x.celo, 0n))}`);
