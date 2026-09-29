/**
 * Live Celo mainnet reads for the "track record" scene: scans the production
 * BingoChain proxy's arenas with batched eth_call(getArena) on forno and tallies
 * arena count / settled / numbers called / seats filled. Prints JSON.
 *   node scripts/bingo-chain/celo-reads.mjs
 */
const P = "0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1";
const R = "https://forno.celo.org";
const SEL_GET = "0x"; // filled below
const rpc = async (body) => (await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
const { execSync } = await import("node:child_process");
const sig = execSync(`cast sig "getArena(uint256)"`).toString().trim();
const data = (id) => sig + id.toString(16).padStart(64, "0");
const words = (hex) => hex.slice(2).match(/.{64}/g).map((w) => BigInt("0x" + w));
const read = async (ids) => {
  const out = [];
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const res = await rpc(chunk.map((id, k) => ({ jsonrpc: "2.0", id: k, method: "eth_call", params: [{ to: P, data: data(id) }, "latest"] })));
    for (const r of res.sort((a, b) => a.id - b.id)) out.push(words(r.result));
  }
  return out;
};
// binary search the last arena with a non-zero creator
let lo = 1, hi = 4096;
while (hi - lo > 1) { const mid = (lo + hi) >> 1; const [w] = await read([mid]); if (w[0] !== 0n) lo = mid; else hi = mid; }
const ids = Array.from({ length: lo }, (_, i) => i + 1);
const all = await read(ids);
const STATES = ["created", "committed", "playing", "revealing", "settled", "cancelled"];
const byState = {};
let calls = 0, seats = 0;
for (const w of all) { const st = STATES[Number(w[2])]; byState[st] = (byState[st] ?? 0) + 1; calls += Number(w[5]); seats += Number(w[4]); }
const block = parseInt((await rpc({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] })).result, 16);
const version = execSync(`cast call ${P} "version()(string)" -r ${R}`).toString().trim();
console.log(JSON.stringify({ at: new Date().toISOString(), block, version, arenas: lo, byState, numbersCalled: calls, seats }, null, 1));
