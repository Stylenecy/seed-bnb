/**
 * Capture-time RPC proxy for the Zero Arena dashboard (port 3252).
 * Forwards every JSON-RPC call to the FE's default BSC-testnet RPC
 * (publicnode), except eth_getLogs, which is answered from logs-cache.json
 * (real logs of the 5 contracts, scanned by logs-scan.mjs) because
 * publicnode has pruned the deploy-era history.
 */
import http from "node:http";
import fs from "node:fs";
const UP = "https://bsc-testnet-rpc.publicnode.com";
const { logs } = JSON.parse(fs.readFileSync(new URL("./logs-cache.json", import.meta.url)));
const n = (h) => (h === undefined || h === "latest" ? Infinity : h === "earliest" ? 0 : parseInt(h, 16));
const getLogs = ({ address, topics = [], fromBlock, toBlock }) => {
  const addrs = address ? [].concat(address).map((a) => a.toLowerCase()) : null;
  const lo = n(fromBlock ?? "0x0"), hi = n(toBlock);
  return logs.filter((l) => {
    const b = parseInt(l.blockNumber, 16);
    if (b < lo || b > hi) return false;
    if (addrs && !addrs.includes(l.address.toLowerCase())) return false;
    return topics.every((t, i) => t == null || [].concat(t).map((x) => x.toLowerCase()).includes((l.topics[i] ?? "").toLowerCase()));
  });
};
const one = async (req) => {
  if (req.method === "eth_getLogs") return { jsonrpc: "2.0", id: req.id, result: getLogs(req.params[0]) };
  const r = await fetch(UP, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
  return r.json();
};
http
  .createServer(async (q, s) => {
    let body = "";
    for await (const c of q) body += c;
    s.setHeader("access-control-allow-origin", "*");
    s.setHeader("access-control-allow-headers", "*");
    if (q.method === "OPTIONS") return s.end();
    try {
      const req = JSON.parse(body);
      const out = Array.isArray(req) ? await Promise.all(req.map(one)) : await one(req);
      s.setHeader("content-type", "application/json");
      s.end(JSON.stringify(out));
    } catch (e) {
      s.statusCode = 500;
      s.end(String(e));
    }
  })
  .listen(3252, () => console.log("rpc proxy :3252"));
