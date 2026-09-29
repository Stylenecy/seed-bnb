/**
 * gridora screen capture — the REAL Gridora verifier (Gridora/frontend/web, `next build` +
 * `next start`), which reads BNB Chain server-side with viem (no wallet connect).
 *   :3310  NEXT_PUBLIC_TESTNET=false · BSC mainnet IdentityRegistry 0x400B…CA5A / TradeJournal 0xE946…d409 / StrategyLedger 0x56D4…D79d
 *   :3311  NEXT_PUBLIC_TESTNET=true  · BSC testnet IdentityRegistry 0x979e…aAFE / TradeJournal 0xCf80…d068 / StrategyLedger 0x400B…CA5A
 * Both use NEXT_PUBLIC_JOURNAL_LOGS_RPC_URL=rpc-proxy.mjs (:3312) for the pruned event history.
 *   node scripts/gridora/capture.mjs http://localhost:3310 main 01
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const [APP, TAG, START] = process.argv.slice(2);
const OUT = path.resolve("public/gridora");
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let n = Number(START);
const shot = async (name, full = false) => {
  await wait(1200);
  const file = `${String(n++).padStart(2, "0")}-${TAG}-${name}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: full });
  console.log("shot", file);
};
const scrollToSel = async (sel, dy = 0) => {
  await page.evaluate((s, d) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + d); }, sel, dy);
  await wait(1000);
};

await page.goto(APP + "/", { waitUntil: "networkidle2", timeout: 120000 });
await wait(3000);
await page.mouse.move(1590, 990);
await shot("hero");
await scrollToSel("#tape", -150);
await shot("tape");
await scrollToSel("#proof", -40);
await shot("proof");
await page.evaluate(() => window.scrollTo(0, 0));
await wait(600);
await page.screenshot({ path: path.join(OUT, `raw-${TAG}-full.png`), fullPage: true });
await browser.close();
