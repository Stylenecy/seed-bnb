import { fetchRpcRecentTradeHistory } from "/Users/kiel/Documents/Hacathon/seed-bnb-indo/bnbhack-winn/neural-alpha/neural-alpha/src/integrations/bsc-rpc-trade-history.ts";
const wallet = process.argv[2]!;
const t0 = Date.now();
console.log(`$ fetchRpcRecentTradeHistory("${wallet}", 4)`);
const trades = await fetchRpcRecentTradeHistory(wallet, 4);
for (const t of trades) console.log(JSON.stringify({ txHash: t.txHash, from: t.fromToken, to: t.toToken, fromAmount: t.fromAmount, toAmount: t.toAmount, price: t.priceAtExecution, ts: new Date(t.timestamp).toISOString() }));
console.log(`swaps=${trades.length} elapsedMs=${Date.now() - t0}`);
