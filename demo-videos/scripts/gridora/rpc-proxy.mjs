/**
 * Capture-time LOGS RPC for the Gridora verifier (port 3312). The page reads its counters
 * (totalAgents, agentInfo, tradeCountByAgent) straight from the public RPC; only its
 * `NEXT_PUBLIC_JOURNAL_LOGS_RPC_URL` client points here. eth_getLogs is answered from
 * logs-cache.json — the REAL `Recorded` logs collected by logs-scan.mjs — because public
 * RPCs have pruned that history. Everything else is forwarded upstream.
 *   http://127.0.0.1:3312/56 → BSC mainnet · http://127.0.0.1:3312/97 → BSC testnet
 */
import http from "node:http";
import fs from "node:fs";
const UP = { 56: "https://bsc-rpc.publicnode.com", 97: "https://bsc-testnet.publicnode.com" };
const cache = JSON.parse(fs.readFileSync(new URL("./logs-cache.json", import.meta.url)));
const LOGS = { 56: cache.mainnet, 97: cache.testnet };
const n = (h) => (h === undefined || h === "latest" ? Infinity : h === "earliest" ? 0 : parseInt(h, 16));
const getLogs = (chain, { address, topics = [], fromBlock, toBlock }) => {
  const addrs = address ? [].concat(address).map((a) => a.toLowerCase()) : null;
  const lo = n(fromBlock ?? "0x0"), hi = n(toBlock);
  return LOGS[chain].filter((l) => {
    const b = parseInt(l.blockNumber, 16);
    if (b < lo || b > hi) return false;
    if (addrs && !addrs.includes(l.address.toLowerCase())) return false;
    return topics.every((t, i) => t == null || [].concat(t).map((x) => x.toLowerCase()).includes((l.topics[i] ?? "").toLowerCase()));
  });
};
const one = async (chain, req) => {
  if (req.method === "eth_getLogs") return { jsonrpc: "2.0", id: req.id, result: getLogs(chain, req.params[0]) };
  const r = await fetch(UP[chain], { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
  return r.json();
};
http
  .createServer(async (q, s) => {
    const chain = q.url.includes("97") ? 97 : 56;
    let body = "";
    for await (const c of q) body += c;
    try {
      const req = JSON.parse(body);
      const out = Array.isArray(req) ? await Promise.all(req.map((x) => one(chain, x))) : await one(chain, req);
      s.setHeader("content-type", "application/json");
      s.end(JSON.stringify(out));
    } catch (e) {
      s.statusCode = 500;
      s.end(String(e));
    }
  })
  .listen(3312, () => console.log("gridora logs rpc :3312"));
