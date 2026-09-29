/**
 * One-off, read-only: collect the REAL `Recorded` logs of Gridora's TradeJournals so the
 * capture proxy (rpc-proxy.mjs) can answer eth_getLogs — public RPCs have pruned that
 * history, so the verifier page would otherwise show "logs gated".
 *   mainnet (56): TradeJournal 0xE946…d409, trades live in blocks 105735625..107091070
 *                 (found by bisecting totalTrades() over archive eth_call), 1000-block pages
 *                 via thirdweb's public RPC.
 *   testnet (97): TradeJournal 0xcf80…d068, the single record tx 0xc50e…4d8e (receipt logs).
 */
import fs from "node:fs";
const OUT = new URL("./logs-cache.json", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const call = async (rpc, method, params) => {
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      if (r.status === 429) { await sleep(1500 * (i + 1)); continue; }
      const j = await r.json();
      if (j.error) { await sleep(1500); continue; }
      return j.result;
    } catch { await sleep(1500); }
  }
  throw new Error(`gave up ${method} ${JSON.stringify(params)}`);
};
const hex = (n) => "0x" + n.toString(16);

const M_RPC = "https://56.rpc.thirdweb.com";
const M_JOURNAL = "0xe946c28ea10bf29aca9a094f66079de84a50d409";
const LO = 105735625, HI = 107091070, PAGE = 1000, CONC = 6;
const pages = [];
for (let b = LO; b <= HI; b += PAGE) pages.push([b, Math.min(b + PAGE - 1, HI)]);
const mainnet = [];
let done = 0;
const worker = async () => {
  while (pages.length) {
    const [f, t] = pages.shift();
    const logs = await call(M_RPC, "eth_getLogs", [{ address: M_JOURNAL, fromBlock: hex(f), toBlock: hex(t) }]);
    mainnet.push(...logs);
    if (++done % 100 === 0) console.log(`pages ${done} · logs ${mainnet.length}`);
  }
};
await Promise.all(Array.from({ length: CONC }, worker));
mainnet.sort((a, b) => parseInt(a.blockNumber, 16) - parseInt(b.blockNumber, 16) || parseInt(a.logIndex, 16) - parseInt(b.logIndex, 16));

const T_RPC = "https://bsc-testnet.publicnode.com";
const rc = await call(T_RPC, "eth_getTransactionReceipt", ["0xc50e64c8bf0bd3cc65f9be2693834eed7961568e63dd24bbe058811ceeb54d8e"]);
const testnet = rc.logs;

fs.writeFileSync(OUT, JSON.stringify({ mainnet, testnet }, null, 1));
console.log(`mainnet ${mainnet.length} logs · testnet ${testnet.length} logs → logs-cache.json`);
