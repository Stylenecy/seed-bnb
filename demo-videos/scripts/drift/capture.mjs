/**
 * drift screen capture — drives the REAL DRIFT web cockpit (`next build` with
 * NEXT_PUBLIC_TRADER_URL=http://localhost:3240, `next start -p 3241`, auth off)
 * against the REAL Python engine (`uvicorn app.main:app --port 3240`) which is
 * pointed at the live BSC-testnet MacroGuard 0x8F2C…Fe5A (reads only; the
 * engine key used for capture is a throwaway, unfunded, non-agent key).
 *
 *   node scripts/drift/capture.mjs [step…]
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://localhost:3241";
const OUT = path.resolve("public/drift");
const steps = process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text().slice(0, 160)); });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name, opts = {}) => {
  await wait(opts.wait ?? 1200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: !!opts.full });
  console.log("shot", name, page.url());
};
const go = async (p, settle = 3000) => {
  await page.goto(APP + p, { waitUntil: "networkidle2", timeout: 90000 });
  await wait(settle);
  await page.mouse.move(1550, 950);
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
  async landing() {
    await go("/", 7000); await shot("01-landing");
    await shot("01-landing-full", { full: true });
  },
  async dash() {
    await go("/dashboard", 8000); await shot("02-dashboard");
    await shot("02-dashboard-full", { full: true });
  },
  async backtest() {
    await go("/dashboard/backtest", 8000); await shot("03-backtest");
    await shot("03-backtest-full", { full: true });
  },
  async bots() {
    await go("/dashboard/bots", 5000); await shot("04-bots"); await shot("04-bots-full", { full: true });
  },
  async connection() {
    await go("/dashboard/connection", 5000); await shot("05-connection"); await shot("05-connection-full", { full: true });
  },
  async portfolio() {
    await go("/dashboard/portfolio", 5000); await shot("06-portfolio");
  },
  async research() {
    await go("/dashboard/backtest", 4000);
    await clickText(/run auto-research/i, "button");
    for (let i = 0; i < 60; i++) {
      await wait(2000);
      const busy = await page.evaluate(() => /running|sweeping|optimi[sz]ing…/i.test(document.body.innerText) && !/robust|overfit|weak/i.test(document.body.innerText));
      if (!busy) break;
    }
    await wait(2500);
    await shot("08-research"); await shot("08-research-full", { full: true });
  },
  /**
   * The MacroGuard banner only renders once a Bybit account is connected. We
   * have no Bybit testnet keys, so ONLY the engine's /connection reply is
   * stubbed for this capture; /chain and /regime come from the live engine
   * reading the real BSC-testnet contract.
   */
  async guard() {
    await page.setRequestInterception(true);
    page.on("request", (r) => {
      if (r.url().startsWith("http://localhost:3240/connection") && r.method() === "GET")
        return r.respond({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ connected: true, testnet: true, balance: null, error: null }) });
      r.continue();
    });
    await go("/dashboard/bots", 6000); await shot("09-guard"); await shot("09-guard-full", { full: true });
    await page.setRequestInterception(false);
  },
  async blog() {
    await go("/blog/building-on-bnb-chain", 2000); await shot("07-blog-bnb");
  },
};
for (const s of steps.length ? steps : Object.keys(S)) await S[s]();
await browser.close();
