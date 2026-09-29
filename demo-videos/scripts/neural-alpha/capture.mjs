/**
 * neural-alpha screen capture — the REAL Neural Alpha Next.js dashboard
 * (`next build` → `next start -p 3321`, AGENT_API_URL → the real agent on :3320
 * running AGENT_MODE=paper BRIDGE_MODE=mock, TWAK CLI off, no keys), paused
 * after cycle 8 (POST /api/control/stop) so every screen shows the same run.
 *   node scripts/neural-alpha/capture.mjs
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://localhost:3321";
const OUT = path.resolve("public/neural-alpha");
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { await wait(1500); await page.screenshot({ path: path.join(OUT, `${name}.png`) }); console.log("shot", name); };
const topOf = (re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll("h1,h2,h3,span,div")].find((e) => e.childElementCount === 0 && rx.test(e.textContent ?? ""));
  return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : -1;
}, re.source);
const scrollTo = async (y) => { await page.evaluate((v) => window.scrollTo(0, v), y); await wait(900); };

await page.goto(APP + "/", { waitUntil: "domcontentloaded" });
await wait(9000);
await page.mouse.move(1590, 990);
await shot("01-overview");
const trades = await topOf(/^Recent Trades$/);
await scrollTo(trades - 60); await shot("02-trades-brain");
const pos = await topOf(/^Open Positions$/);
await scrollTo(pos - 40); await shot("03-positions-wallet");
const sig = await topOf(/^Signal Monitor$/);
await scrollTo(sig - 30); await shot("04-signals");
console.log({ trades, pos, sig });
await browser.close();
