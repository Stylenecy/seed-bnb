const RPCS=(process.env.RPCS||"https://1rpc.io/bnb").split(",");
let ri=0;
const call=async(m,p)=>{for(let a=0;a<6;a++){const u=(m==="eth_getLogs")?RPCS[0]:["https://bsc-dataseed.binance.org/","https://bsc-dataseed1.binance.org/","https://bsc-dataseed2.binance.org/"][ri++%3];try{const r=await fetch(u,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:m,params:p})});const j=await r.json();if(j.error)throw new Error(JSON.stringify(j.error));return j.result;}catch(e){if(a==5)throw e;await new Promise(r=>setTimeout(r,300));}}};
const ETH="0x2170Ed0880ac9A755fd29B2688956BD959F933F8".toLowerCase();
const USDT="0x55d398326f99059ff775485246999027b3197955";
const T="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const head=parseInt(await call("eth_blockNumber",[]),16);
const DEPTH=+(process.env.DEPTH||4000), STEP=+(process.env.STEP||20);
const byTx=new Map();
for(let s=head-DEPTH;s<head;s+=STEP){try{const logs=await call("eth_getLogs",[{address:ETH,topics:[T],fromBlock:"0x"+s.toString(16),toBlock:"0x"+Math.min(head,s+STEP-1).toString(16)}]);for(const l of logs){const f="0x"+l.topics[1].slice(26),t="0x"+l.topics[2].slice(26);const e=byTx.get(l.transactionHash)||new Set();e.add(f);e.add(t);byTx.set(l.transactionHash,e);}}catch(e){console.error("chunk",s,String(e).slice(0,100));}}
console.error("head",head,"txs",byTx.size);
const cnt={};
const arr=[...byTx.keys()];
for(let i=0;i<arr.length;i+=25){await Promise.all(arr.slice(i,i+25).map(async h=>{try{const t=await call("eth_getTransactionByHash",[h]);const fr=t.from.toLowerCase();if(byTx.get(h).has(fr)){(cnt[fr]??=[]).push(h);}}catch{}}));}
const top=Object.entries(cnt).sort((a,b)=>b[1].length-a[1].length).slice(0,10);
for(const [a,h] of top)console.log(a,h.length,h.slice(0,3).join(","));
