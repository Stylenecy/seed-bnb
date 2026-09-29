/**
 * claudelance screen capture — drives the REAL Claudelance web app
 * (`next build` with apps/web/.env.bsc-testnet, `next start -p 3210`) in
 * headless Chrome. Dark theme (system). A read-only injected EIP-1193 wallet
 * exposes the BSC-testnet test WORKER address from VERIFY-BNB.md (no key,
 * it can't sign) so the profile/assets view reads its real balances on chain 97.
 *
 *   node scripts/claudelance/capture.mjs [step…]
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3210";
const OUT = path.resolve("public/claudelance");
const WORKER = "0x199C32c75865117e0a8E4e94E67CA28279a9FFc7"; // VERIFY-BNB.md test worker
const CHAIN = process.env.CHAIN ?? "0x61";
const steps = process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--force-dark-mode", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
const RPC = { "0x61": "https://bsc-testnet-rpc.publicnode.com", "0xa4ec": "https://forno.celo.org" };
await page.evaluateOnNewDocument((addr, chain, rpc) => {
  const listeners = {};
  let cur = chain;
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
}, WORKER, CHAIN, RPC);
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text().slice(0, 160)); });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name, opts = {}) => {
  await wait(opts.wait ?? 1200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: !!opts.full });
  console.log("shot", name, page.url());
};
const go = async (p) => {
  await page.goto(APP + p, { waitUntil: "networkidle2", timeout: 60000 });
  await wait(2500);
  await page.evaluate(() => document.querySelector('[aria-label="Dismiss"]')?.click());
  await page.mouse.move(1500, 900);
  await wait(900);
};
/** Scroll the page to y (CSS px) so whileInView sections animate in, then settle. */
const scrollTo = async (y) => {
  for (let cur = 0; cur <= y; cur += 400) { await page.evaluate((v) => window.scrollTo(0, v), cur); await wait(250); }
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await wait(1500);
};
const clickText = async (re, sel = "button, a, [role=button], div") => {
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

const TAG = CHAIN === "0x61" ? "bsc" : "celo";
const S = {
  async home() {
    await go("/"); await shot(`${TAG}-home`);
    for (const y of [900, 1800, 2700, 3600, 4400]) { await scrollTo(y); await shot(`${TAG}-home-${y}`, { wait: 400 }); }
  },
  async celo() {
    await go("/workers"); await shot(`${TAG}-workers`);
    await go("/bounties"); await clickText(/^\s*resolved\s*$/i, "button"); await wait(4000); await shot(`${TAG}-bounties`);
    await go("/bounty/250"); await shot(`${TAG}-bounty`);
    await go("/revenue"); await shot(`${TAG}-revenue`);
  },
  async profile() {
    await go("/profile"); await wait(4000); await shot(`${TAG}-profile`);
    await scrollTo(700); await shot(`${TAG}-profile-700`, { wait: 1500 });
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(800);
    const net = await page.$('[title^="Switch network"]');
    if (net) { await net.click(); await wait(1800); await shot(`${TAG}-chain-modal`); }
  },
  async pages() {
    await go("/"); await shot("01-home"); await shot("01-home-full", { full: true });
    await go("/bounties"); await shot("02-bounties");
    await go("/bounty/250"); await shot("03-bounty"); await shot("03-bounty-full", { full: true });
    await go("/revenue"); await shot("04-revenue");
    await go("/workers"); await shot("05-workers");
    await go("/about"); await shot("06-about-full", { full: true });
  },
  async wallet() {
    await go("/profile");
    await shot("10-profile-pre");
    await clickText(/^\s*connect( wallet)?\s*$/i, "button");
    await wait(1500);
    await shot("11-connect-modal");
    await clickText(/metamask|browser wallet|injected/i, "button");
    await wait(4000);
    await shot("12-profile");
    await shot("12-profile-full", { full: true });
    const net = await page.$('[title^="Switch network"]');
    if (net) { await net.click(); await wait(1500); await shot("13-chain-modal"); }
  },
};
for (const s of steps.length ? steps : Object.keys(S)) await S[s]();
await browser.close();
