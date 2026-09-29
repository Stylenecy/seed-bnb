/**
 * bingo-chain screen capture — drives the REAL BINGOChain web app built for
 * BSC testnet (`NEXT_PUBLIC_CHAIN_ID=97` + apps/web/.env.bsc-testnet,
 * `next start -p 3220`, index stub on :3229) in headless Chrome, plus the live
 * Celo production app (bingochain.vercel.app) for the Celo track record.
 * A read-only injected EIP-1193 wallet exposes Player 1 from VERIFY-BNB.md
 * (the group wallet, no key, can't sign) so every read is real chain state.
 *
 *   node scripts/bingo-chain/capture.mjs [step…]
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3220";
const CELO_APP = "https://bingochain.vercel.app";
const OUT = path.resolve("public/bingo-chain");
const P1 = "0x3F46b654035aA92738FE4dC7dc9538Ca9bA07CEA";
const steps = process.argv.slice(2);
const RPC = { "0x61": "https://bsc-testnet-rpc.publicnode.com", "0xa4ec": "https://forno.celo.org" };

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
let CHAIN = "0x61";
await page.evaluateOnNewDocument((addr, rpc) => {
  const listeners = {};
  let cur = window.__chain ?? (location.host.includes("vercel") ? "0xa4ec" : "0x61");
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
          return cur;
        case "net_version":
          return String(parseInt(cur, 16));
        case "wallet_switchEthereumChain":
          cur = params[0].chainId;
          (listeners.chainChanged ?? []).forEach((f) => f(cur));
          return null;
        case "wallet_addEthereumChain":
        case "wallet_requestPermissions":
        case "wallet_getPermissions":
          return [{ parentCapability: "eth_accounts" }];
        default: {
          const r = await fetch(rpc[cur], { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
          const j = await r.json();
          if (j.error) throw j.error;
          return j.result;
        }
      }
    },
  };
}, P1, RPC);
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text().slice(0, 160)); });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name, opts = {}) => {
  await wait(opts.wait ?? 1200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: !!opts.full });
  console.log("shot", name, page.url());
};
const go = async (base, p, settle = 3500) => {
  await page.goto(base + p, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => console.log("goto", e.message));
  await wait(settle);
  await page.evaluate(() => document.querySelector('[aria-label="Dismiss"]')?.click());
  await wait(500);
  await page.mouse.move(1580, 980);
};
const scrollTo = async (y) => {
  for (let cur = 0; cur <= y; cur += 400) { await page.evaluate((v) => window.scrollTo(0, v), cur); await wait(250); }
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await wait(1500);
};
const clickText = async (re, sel = "button, a, [role=button]") => {
  const ok = await page.evaluate((src, sel) => {
    const rx = new RegExp(src, "i");
    const els = [...document.querySelectorAll(sel)].filter((e) => rx.test(e.textContent ?? "") && e.offsetParent !== null);
    els.sort((a, b) => (a.textContent ?? "").length - (b.textContent ?? "").length);
    if (!els[0]) return false;
    els[0].click();
    return true;
  }, re.source, sel);
  console.log("click", re.source, ok);
  return ok;
};

const S = {
  async bsc() {
    await go(APP, "/", 6000); await shot("bsc-home");
    await go(APP, "/arenas", 7000); await clickText(/^\s*all\s*$/i, "button"); await wait(2500); await shot("bsc-arenas");
    await go(APP, "/arena/1", 8000); await shot("bsc-arena1");
    await shot("bsc-arena1-full", { full: true });
    for (const y of [700, 1400]) { await scrollTo(y); await shot(`bsc-arena1-${y}`, { wait: 800 }); }
    await go(APP, "/create", 5000); await shot("bsc-create");
    await go(APP, "/how-to-play", 3000); await shot("bsc-how");
  },
  async connect() {
    await go(APP, "/arena/1", 6000);
    await clickText(/^\s*connect( wallet)?\s*$/i);
    await wait(1500); await shot("bsc-connect");
    await clickText(/metamask|browser|injected/i);
    await wait(6000); await shot("bsc-arena1-connected");
    await shot("bsc-arena1-connected-full", { full: true });
    await go(APP, "/profile", 7000); await shot("bsc-profile");
  },
  async celo() {
    await go(CELO_APP, "/", 7000); await shot("celo-home");
    await go(CELO_APP, "/arenas", 9000); await shot("celo-arenas");
    await go(CELO_APP, "/competition", 7000); await shot("celo-cup");
    for (const id of [200, 470]) { await go(CELO_APP, `/arena/${id}`, 9000); await shot(`celo-arena${id}`); await shot(`celo-arena${id}-full`, { full: true }); }
  },
};
for (const s of steps.length ? steps : Object.keys(S)) await S[s]();
await browser.close();
