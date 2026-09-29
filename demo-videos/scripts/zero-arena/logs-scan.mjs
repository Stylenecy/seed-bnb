/**
 * One-off: scan ALL logs of the 5 Zero Arena BSC-testnet contracts from the
 * deploy block to head (1000-block pages, throttled, via thirdweb's public
 * RPC which still serves pruned history) → logs-cache.json. The capture proxy
 * (rpc-proxy.mjs) serves eth_getLogs from this cache because publicnode
 * (the FE default) has pruned that history.
 */
import fs from "node:fs";
const RPC = "https://97.rpc.thirdweb.com";
const ADDR = [
  "0x4927B51f574035622826d8E703b712Bb5F12bDC8",
  "0x90D159C2d0d247BAafbd865a6FdD664E397eD984",
  "0x6d0fda52C480E96D2Da3aB0e071d4c6A27Cd263c",
  "0xc013bf70429B079D076e36D966A16F382b9c7e46",
  "0xA50314e3d9Abd8f35134a91Fe117a18e06461a55",
];
const OUT = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const call = async (method, params) => {
  for (let i = 0; i < 12; i++) {
    const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (r.status === 429) { await sleep(2000 * (i + 1)); continue; }
    const j = await r.json();
    if (j.error) { console.log("err", j.error.message); await sleep(2000); continue; }
    return j.result;
  }
  throw new Error("gave up");
};
const head = parseInt(await call("eth_blockNumber", []), 16);
const logs = [];
for (let from = 132984300; from <= head; from += 1000) {
  const to = Math.min(from + 999, head);
  const res = await call("eth_getLogs", [{ address: ADDR, fromBlock: "0x" + from.toString(16), toBlock: "0x" + to.toString(16) }]);
  if (res.length) console.log(from, res.length);
  logs.push(...res);
  await sleep(350);
}
fs.writeFileSync(OUT, JSON.stringify({ head, logs }, null, 1));
console.log("done head", head, "logs", logs.length);
