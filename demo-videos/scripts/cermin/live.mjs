/**
 * cermin LIVE capture on REAL BSC TESTNET (chain 97) — no fork.
 *
 * Drives the real Cermin frontend (`next start -p 3195`, built with
 * .env.bsc-testnet) in headless Chrome with an injected EIP-1193 wallet whose
 * key lives only in this Node process. The vault owner is a fresh throwaway
 * wallet (the deployer already owns the closed smoke vault, and the factory
 * allows one vault per owner). The deployer (owner of MockPriceFeed) funds the
 * throwaway, moves the mock price with `cast`, and calls the permissionless
 * `skim` as the keeper. Everything the owner does goes through the UI:
 * onboarding → createVault, Defend now, Withdraw, Close vault. At the end the
 * throwaway sweeps its BNB (incl. the returned collateral) back to the deployer.
 *
 *   DEPLOYER_PK=… OWNER_KEYFILE=… STATE=… node scripts/cermin/live.mjs [fromPhase]
 *
 * Keys: DEPLOYER_PK comes from the shell env only; it is never printed or
 * written. OWNER_KEYFILE is a throwaway key kept outside the repo.
 */
import puppeteer from "puppeteer-core";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire("/Users/kiel/Documents/Hacathon/seed-bnb-indo/Cermin/frontend/package.json");
const { privateKeyToAccount, generatePrivateKey } = require("viem/accounts");
const { createPublicClient, createWalletClient, http, parseEther, formatEther, formatUnits } = require("viem");
const { bscTestnet } = require("viem/chains");

// Node-side sends/receipts/cast use BNB's dataseed (fast); eth_getLogs needs publicnode.
const RPC = process.env.RPC ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
const LOGS_RPC = "https://bsc-testnet-rpc.publicnode.com";
const APP = process.env.APP_URL ?? "http://127.0.0.1:3195";
const OUT = process.env.OUT ?? path.resolve("public/cermin");
const FEED = "0xf59178E78ED1056ACD16d0a4968713fFe028da5F";
const FACTORY = "0x4A832Cf199B236ecE52c7AFC50F355d0a1eB1930";
const MUSD = "0x3Bffc923F1e4636fE8E09a76b2bfc57AD27A3007";
const ZERO = "0x0000000000000000000000000000000000000000";
const FUND = parseEther(process.env.FUND ?? "0.045");

const DEPLOYER_PK = process.env.DEPLOYER_PK;
if (!DEPLOYER_PK) throw new Error("DEPLOYER_PK env missing");
const deployer = privateKeyToAccount(DEPLOYER_PK);
const KEYFILE = process.env.OWNER_KEYFILE;
let opk = fs.existsSync(KEYFILE) ? fs.readFileSync(KEYFILE, "utf8").trim() : null;
if (!opk) {
  opk = generatePrivateKey();
  fs.writeFileSync(KEYFILE, opk, { mode: 0o600 });
}
const owner = privateKeyToAccount(opk);
const STATE = process.env.STATE;
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { txs: {} };
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
console.log("deployer", deployer.address, "owner(throwaway)", owner.address);

const pub = createPublicClient({ chain: bscTestnet, transport: http(RPC, { timeout: 60000, retryCount: 4 }) });
const ownerWallet = createWalletClient({ account: owner, chain: bscTestnet, transport: http(RPC) });
const deployerWallet = createWalletClient({ account: deployer, chain: bscTestnet, transport: http(RPC) });
if ((await pub.getChainId()) !== 97) throw new Error("not chain 97");

const redact = (s) => String(s ?? "").split(DEPLOYER_PK).join("<key>").split(DEPLOYER_PK.replace(/^0x/, "")).join("<key>");
/** cast send as the deployer; the key goes in argv of the child only, never logged.
 *  --async returns the hash on broadcast; the receipt is awaited with viem. A failed
 *  broadcast is retried only if the deployer nonce did not move. */
const castOnce = (to, sig, args, nonce) =>
  new Promise((resolve, reject) => {
    execFile(
      "cast",
      ["send", to, sig, ...args, "--rpc-url", RPC, "--chain", "97", "--async", "--nonce", String(nonce), "--private-key", DEPLOYER_PK],
      { maxBuffer: 1 << 22, timeout: 90000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`cast send ${sig} failed: ${redact(stderr).slice(0, 300)}`));
        resolve(stdout.trim());
      },
    );
  });
const castSend = async (to, sig, ...args) => {
  const nonce = await pub.getTransactionCount({ address: deployer.address, blockTag: "pending" });
  let hash;
  for (let i = 0; i < 4 && !hash; i++) {
    try {
      hash = await castOnce(to, sig, args, nonce);
    } catch (e) {
      console.log("retry", String(e.message).slice(0, 200));
      await new Promise((r) => setTimeout(r, 4000));
      const n2 = await pub.getTransactionCount({ address: deployer.address, blockTag: "pending" });
      if (n2 > nonce) throw new Error(`${sig}: nonce moved but hash unknown — inspect deployer txs`);
    }
  }
  if (!hash) throw new Error(`${sig} not broadcast`);
  const r = await pub.waitForTransactionReceipt({ hash, timeout: 120000 });
  if (r.status !== "success") throw new Error(`${sig} ${hash} ${r.status}`);
  console.log("cast", sig, hash);
  return hash;
};

const VAULT_ABI = [
  { type: "function", name: "getICR", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getDebt", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getCollateral", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getShadow", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }, { type: "uint256" }] },
];
const vaultOf = (a) =>
  pub.readContract({ address: FACTORY, abi: [{ type: "function", name: "vaultOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] }], functionName: "vaultOf", args: [a] });
const snap = async (label) => {
  const v = state.vault;
  const price = await pub.readContract({ address: FEED, abi: [{ type: "function", name: "fetchPrice", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }], functionName: "fetchPrice" });
  const out = { label, price: formatUnits(price, 18), ownerBNB: formatEther(await pub.getBalance({ address: owner.address })) };
  if (v) {
    const debt = await pub.readContract({ address: v, abi: VAULT_ABI, functionName: "getDebt" });
    out.debt = formatUnits(debt, 18);
    out.coll = formatEther(await pub.readContract({ address: v, abi: VAULT_ABI, functionName: "getCollateral" }));
    if (debt > 0n) {
      out.icr = (await pub.readContract({ address: v, abi: VAULT_ABI, functionName: "getICR" })).toString();
      const [sp, vv] = await pub.readContract({ address: v, abi: VAULT_ABI, functionName: "getShadow" });
      out.spendable = formatUnits(sp, 18);
      out.vaultValue = formatUnits(vv, 18);
    }
  }
  (state.snaps ??= []).push(out);
  save();
  console.log("snap", JSON.stringify(out));
};

// ---------------------------------------------------------------- browser
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  userDataDir: process.env.PROFILE,
  args: ["--hide-scrollbars", "--accept-lang=en-US", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
let lastSent = null;
await page.exposeFunction("__demoSign", async (hex) => owner.signMessage({ message: { raw: hex } }));
await page.exposeFunction("__demoRpc", async (method, params) => {
  const r = await fetch(method === "eth_getLogs" ? LOGS_RPC : RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) return { error: j.error };
  return { result: j.result };
});
await page.exposeFunction("__demoSend", async (tx) => {
  try {
    const hash = await ownerWallet.sendTransaction({
      to: tx.to,
      data: tx.data ?? tx.input,
      value: tx.value ? BigInt(tx.value) : 0n,
      ...(tx.gas ? { gas: BigInt(tx.gas) } : {}),
    });
    console.log("UI tx sent", hash);
    lastSent = hash;
    return { result: hash };
  } catch (e) {
    console.log("UI tx failed", String(e.shortMessage ?? e.message).slice(0, 300));
    return { error: { code: -32000, message: String(e.shortMessage ?? e.message) } };
  }
});
await page.evaluateOnNewDocument((addr) => {
  const listeners = {};
  window.ethereum = {
    isMetaMask: true,
    on: (ev, fn) => ((listeners[ev] ??= []).push(fn)),
    removeListener: () => {},
    request: async ({ method, params }) => {
      switch (method) {
        case "eth_accounts":
        case "eth_requestAccounts":
          return [addr];
        case "eth_chainId":
          return "0x61";
        case "net_version":
          return "97";
        case "wallet_switchEthereumChain":
        case "wallet_addEthereumChain":
        case "wallet_revokePermissions":
          return null;
        case "wallet_requestPermissions":
        case "wallet_getPermissions":
          return [{ parentCapability: "eth_accounts", caveats: [{ type: "restrictReturnedAccounts", value: [addr] }] }];
        case "personal_sign":
          return window.__demoSign(params[0]);
        case "eth_sendTransaction": {
          const r = await window.__demoSend(params[0]);
          if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
          return r.result;
        }
        case "wallet_getCapabilities":
        case "wallet_sendCalls":
        case "eth_signTypedData_v4":
          throw Object.assign(new Error(`demo wallet: ${method} unsupported`), { code: 4200 });
        default: {
          const r = await window.__demoRpc(method, params ?? []);
          if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code, data: r.error.data });
          return r.result;
        }
      }
    },
  };
  const icon = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#F0B90B"/></svg>');
  const detail = Object.freeze({ info: { uuid: "7f1c1a3e-demo-4cd0-9d7e-000000000002", name: "Demo Wallet", icon, rdns: "xyz.demo.wallet" }, provider: window.ethereum });
  const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
  window.addEventListener("eip6963:requestProvider", announce);
  announce();
}, owner.address);
// Same chain (97), faster node: the app's publicnode reads go to BNB's dataseed,
// except eth_getLogs (dataseed rejects it), which stays on publicnode.
{
  const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS" };
  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    if (!/bsc-testnet-rpc\.publicnode\.com/.test(req.url())) return req.continue();
    if (req.method() === "OPTIONS") return req.respond({ status: 204, headers: CORS, body: "" });
    const body = req.postData() ?? "";
    if (/eth_getLogs/.test(body)) return req.continue();
    try {
      const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body });
      req.respond({ status: 200, contentType: "application/json", headers: CORS, body: await r.text() });
    } catch {
      req.continue();
    }
  });
}
page.on("console", (m) => {
  if (m.type() === "error") console.log("[page]", m.text().slice(0, 200));
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => {
  await wait(1200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("shot", name);
};
const clickText = async (src, sel = "button, a, [role=button]") => {
  const ok = await page.evaluate(
    (src, sel) => {
      const rx = new RegExp(src, "i");
      const els = [...document.querySelectorAll(sel)].filter((e) => rx.test((e.innerText || "").trim()) && e.offsetParent !== null && !e.disabled);
      const el = els.sort((a, b) => a.innerText.length - b.innerText.length)[0];
      if (!el) return false;
      el.click();
      return true;
    },
    src,
    sel,
  );
  console.log("click", src, ok);
  if (!ok) throw new Error(`no clickable ${src}`);
};
const waitText = async (src, timeout = 60000) => {
  await page.waitForFunction((s) => new RegExp(s).test(document.body.innerText), { timeout, polling: 500 }, src);
};
/** Scroll so the card holding `text` has its top at `topCss` (px in the viewport). */
const scrollCard = async (text, topCss) => {
  await page.evaluate(
    (text, topCss) => {
      const leaf = [...document.querySelectorAll("p, span, div")].find((e) => e.childElementCount === 0 && e.innerText?.trim() === text);
      let card = leaf;
      while (card && !/rounded-(2xl|3xl|\[)/.test(card.className || "")) card = card.parentElement;
      card ??= leaf;
      const y = card.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, y - topCss);
    },
    text,
    topCss,
  );
  await wait(1500);
};
const gotoDash = async (ready) => {
  await page.goto(APP + "/", { waitUntil: "networkidle2" });
  await wait(2500);
  await clickText("^Open dashboard$");
  await waitText(ready, 90000);
  await wait(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
};
const waitReceipt = async (hash) => {
  const r = await pub.waitForTransactionReceipt({ hash, timeout: 120000 });
  if (r.status !== "success") throw new Error(`tx ${hash} ${r.status}`);
  return r;
};
const shots3 = async (prefix) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(`${prefix}-top`);
  await scrollCard("Locked · never sold", 298);
  await shot(`${prefix}-cards`);
  await scrollCard("Everything your vault does, on-chain", 400);
  await shot(`${prefix}-activity`);
  await page.evaluate(() => window.scrollTo(0, 0));
};

/** RainbowKit connect with the injected Demo Wallet (fresh profile). */
const connect = async () => {
  await page.goto(APP + "/", { waitUntil: "networkidle2" });
  await wait(3000);
  const connected = await page.evaluate((a) => document.body.innerText.includes(a.slice(0, 4) + "…") || document.body.innerText.includes(a.slice(0, 4) + "..."), owner.address);
  if (connected) return;
  await clickText("^Open dashboard$");
  await wait(2500);
  if (await page.evaluate(() => /Demo Wallet/.test(document.body.innerText))) {
    await clickText("^Demo Wallet$", "button, [role=button], div");
    await wait(5000);
  }
  console.log("after connect", page.url());
};

const PHASES = ["fund", "open", "opendash", "skim", "dip", "defend", "withdraw", "close", "sweep"];
const from = process.argv[2] ?? "fund";
const todo = PHASES.slice(PHASES.indexOf(from)).filter((p) => p !== "opendash" || from === "opendash");
if (process.argv[2] === "probe") todo.splice(0, todo.length, "probe");

for (const ph of todo) {
  console.log("=== phase", ph);
  if (ph === "probe") {
    await page.goto(APP + "/", { waitUntil: "networkidle2" });
    await wait(3000);
    await shot("x-probe-landing");
    console.log(await page.evaluate(() => [...document.querySelectorAll("button,a")].map((b) => b.innerText.trim()).filter(Boolean).slice(0, 20).join(" | ")));
    await connect();
    await shot("x-probe-connected");
    await wait(8000);
    await page.evaluate(() => document.querySelector('a[href="/onboard"]')?.click());
    await wait(5000);
    console.log("at", page.url());
    await shot("x-probe-onboard");
    console.log(await page.evaluate(() => document.body.innerText.slice(0, 600)));
  }
  if (ph === "fund") {
    const bal = await pub.getBalance({ address: owner.address });
    if (bal < FUND) {
      const h = await deployerWallet.sendTransaction({ to: owner.address, value: FUND - bal });
      await waitReceipt(h);
      state.txs.fund = h;
      save();
      console.log("funded", h);
    }
    // Mock feed back to the deploy-time $120,000 so 0.04 tBNB clears the 2,000 MUSD min debt.
    state.txs.priceOpen = await castSend(FEED, "setPrice(uint256)", "120000000000000000000000");
    save();
    await snap("funded");
  }
  if (ph === "open") {
    await connect();
    await wait(8000);
    await page.evaluate(() => document.querySelector('a[href="/onboard"]')?.click());
    await wait(5000);
    console.log("at", page.url());
    if (!/deposit|BNB/i.test(await page.evaluate(() => document.body.innerText))) throw new Error("onboard not ready");
    await page.focus('input[placeholder="0.00"]');
    await page.keyboard.type("0.04", { delay: 40 });
    await wait(800);
    await shot("l-onb-deposit");
    await clickText("^Continue$");
    await wait(1500);
    await clickText("Forever Allowance");
    await wait(600);
    await clickText("^Continue$");
    await wait(1500);
    await clickText("Balanced");
    await wait(600);
    await clickText("^Continue$");
    await wait(1800);
    await shot("l-onb-preview");
    await clickText("Create vault");
    await wait(1800);
    await shot("l-onb-confirm");
    lastSent = null;
    await clickText("Sign & create vault");
    for (let i = 0; i < 60 && !lastSent; i++) await wait(500);
    if (!lastSent) throw new Error("createVault not sent");
    state.txs.open = lastSent;
    save();
    await waitReceipt(lastSent);
    await waitText("Vault created", 90000);
    await shot("l-onb-created");
    state.vault = await vaultOf(owner.address);
    save();
  }
  if (ph === "open" || ph === "opendash") {
    await snap("open");
    await gotoDash("BNB \\$120,000");
    await waitText("Vault opened", 90000);
    await shots3("s1-open");
  }
  if (ph === "skim") {
    state.txs.priceUp = await castSend(FEED, "setPrice(uint256)", "132000000000000000000000");
    save();
    // skim() is permissionless — the deployer plays the keeper bot here.
    state.txs.skim = await castSend(state.vault, "skim(address,address)", ZERO, ZERO);
    save();
    await snap("skim");
    await gotoDash("BNB \\$132,000");
    await waitText("Skimmed on a peak", 90000);
    await shots3("s2-skim");
  }
  if (ph === "dip") {
    state.txs.priceDown = await castSend(FEED, "setPrice(uint256)", "90000000000000000000000");
    save();
    await snap("dip");
    await gotoDash("Defend now");
    await shots3("s3-dip");
  }
  if (ph === "defend") {
    await gotoDash("Defend now");
    lastSent = null;
    await clickText("Defend now");
    for (let i = 0; i < 60 && !lastSent; i++) await wait(500);
    if (!lastSent) throw new Error("defend not sent");
    state.txs.defend = lastSent;
    save();
    await waitReceipt(lastSent);
    await snap("defend");
    await gotoDash("Defended the dip");
    await shots3("s4-defend");
  }
  if (ph === "withdraw") {
    await gotoDash("Defended the dip");
    await scrollCard("Locked · never sold", 298);
    await clickText("^Withdraw$");
    await wait(800);
    await page.type('input[placeholder="Amount (MUSD)"]', "100", { delay: 40 });
    await page.type('input[placeholder="Recipient (0x...)"]', owner.address, { delay: 5 });
    await wait(800);
    await shot("s5-withdraw-form");
    lastSent = null;
    await clickText("^Confirm$");
    for (let i = 0; i < 60 && !lastSent; i++) await wait(500);
    if (!lastSent) throw new Error("withdraw not sent");
    state.txs.withdraw = lastSent;
    save();
    await waitReceipt(lastSent);
    await snap("withdraw");
    await gotoDash("Withdrew from Shadow");
    await shots3("s5-withdraw");
  }
  if (ph === "close") {
    await gotoDash("Withdrew from Shadow");
    await scrollCard("Close vault", 120);
    await page.evaluate(() => {
      const cb = [...document.querySelectorAll('input[type="checkbox"]')].find((c) => /closes my vault/.test(c.parentElement?.innerText ?? ""));
      cb.scrollIntoView({ block: "center" });
      cb.click();
    });
    await wait(1000);
    await shot("s6-close-panel");
    const before = await pub.getBalance({ address: owner.address });
    state.ownerBeforeClose = formatEther(before);
    const sent = [];
    const origLast = () => lastSent;
    lastSent = null;
    await clickText("close vault$");
    // Either a single close, or approve → close.
    for (let i = 0; i < 240; i++) {
      if (lastSent && !sent.includes(lastSent)) sent.push(lastSent);
      const done = await page.evaluate(() => /Vault closed/.test(document.body.innerText));
      if (done) break;
      await wait(500);
    }
    if (sent.length > 1) state.txs.approve = sent[0];
    state.txs.close = sent[sent.length - 1] ?? origLast();
    save();
    await waitReceipt(state.txs.close);
    await wait(2000);
    await shot("s6-close-done");
    const after = await pub.getBalance({ address: owner.address });
    state.ownerAfterClose = formatEther(after);
    save();
    await snap("closed");
    await page.goto(APP + "/dashboard", { waitUntil: "networkidle2" });
    await wait(9000);
    await shot("s6-closed-dash");
    await scrollCard("Everything your vault does, on-chain", 400).catch(() => {});
    await shot("s6-closed-activity");
  }
  if (ph === "sweep") {
    const bal = await pub.getBalance({ address: owner.address });
    const gasPrice = await pub.getGasPrice();
    const fee = 21000n * gasPrice;
    if (bal > fee) {
      const h = await ownerWallet.sendTransaction({ to: deployer.address, value: bal - fee, gas: 21000n, gasPrice });
      await waitReceipt(h);
      state.txs.sweep = h;
      save();
      console.log("swept", formatEther(bal - fee), h);
    }
    await snap("swept");
    console.log("deployer balance", formatEther(await pub.getBalance({ address: deployer.address })));
  }
}
await browser.close();
console.log(JSON.stringify(state.txs, null, 2));
