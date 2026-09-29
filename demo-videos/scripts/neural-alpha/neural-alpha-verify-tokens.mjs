import fs from "node:fs";
const src=fs.readFileSync("/Users/kiel/Documents/Hacathon/seed-bnb-indo/bnbhack-winn/neural-alpha/neural-alpha/src/integrations/bsc-token-addresses.ts","utf8");
const entries=[...src.matchAll(/^\s*"?([A-Za-z0-9$]+)"?\s*:\s*"(0x[0-9a-fA-F]+)"/gm)].map(m=>[m[1],m[2]]);
const call=async(m,p)=>{for(let a=0;a<4;a++){try{const r=await fetch(["https://bsc-dataseed.binance.org/","https://bsc-dataseed1.binance.org/"][a%2],{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:m,params:p})});const j=await r.json();if(j.error)throw 0;return j.result;}catch{await new Promise(r=>setTimeout(r,300));}}return null;};
const dec=(hex)=>{if(!hex||hex==="0x")return null;const b=Buffer.from(hex.slice(2),"hex");if(b.length>=96){const len=parseInt(b.slice(32,64).toString("hex"),16);return b.slice(64,64+len).toString("utf8");}return b.toString("utf8").replace(/\0/g,"");};
const FIXED=new Set(["BONK","DEXE","BRETT","LUNC","PENGU","SUSHI","COMP","AXS","STG","BabyDoge","APE"]);
let ok=0,out=[];
for(const [sym,addr] of entries){const [code,s,d]=await Promise.all([call("eth_getCode",[addr,"latest"]),call("eth_call",[{to:addr,data:"0x95d89b41"},"latest"]),call("eth_call",[{to:addr,data:"0x313ce567"},"latest"])]);const hasCode=code&&code!=="0x";const onSym=dec(s);const decimals=d&&d!=="0x"?parseInt(d,16):null;if(hasCode&&onSym)ok++;out.push({sym,addr,hasCode,codeBytes:code?(code.length-2)/2:0,onSym,decimals,fixed:FIXED.has(sym)});}
fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));
console.log("entries",entries.length,"withCode+symbol",ok);
for(const o of out.filter(o=>o.fixed||!o.hasCode||(o.onSym||"").toUpperCase()!==o.sym.toUpperCase()))console.log(o.fixed?"FIXED":"     ",o.sym.padEnd(10),o.addr,o.hasCode?"code":"NO CODE",o.codeBytes,"symbol()="+o.onSym,"dec="+o.decimals);
