/**
 * bridgeagent screen capture — the REAL BridgeAgent status page
 * (BridgeAgent/web: `next build` + `next start -p 3290` with
 * web/.env.bsc-testnet), which SSR-reads the live BSC-testnet
 * IdentityRegistry 0xf828…018C + TradeJournal 0x108A…F45E via viem.
 *   node scripts/bridgeagent/capture.mjs
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://localhost:3290";
const OUT = path.resolve("public/bridgeagent");
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name, full = false) => {
  await wait(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log("shot", name);
};
const scrollToSel = async (sel, dy = 0) => {
  await page.evaluate((s, d) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + d); }, sel, dy);
  await wait(900);
};
const clickText = async (re, sel = "button") => page.evaluate((src, sel) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll(sel)].find((e) => rx.test(e.textContent ?? ""));
  if (el) el.click();
  return !!el;
}, re.source, sel);

await page.goto(APP + "/", { waitUntil: "networkidle2", timeout: 90000 });
await wait(2500);
await page.mouse.move(1590, 990);
await shot("01-hero");
await scrollToSel("#agent-heading", -120);
await shot("02-agent");
await scrollToSel("section[aria-label=Trades]", 20);
await shot("03-trades");
console.log("expand", await clickText(/0x262154ad/));
await wait(800);
await shot("04-trade-open");
console.log("verify", await clickText(/verify/i));
await wait(800);
await scrollToSel("footer", -900);
await shot("05-verify");
await page.evaluate(() => window.scrollTo(0, 0));
await shot("00-full", true);
await browser.close();
