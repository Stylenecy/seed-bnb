/**
 * tessera screen capture — drives the REAL Tessera Next.js frontend (a copy of
 * Tessera/frontend, `next build` with NEXT_PUBLIC_API_URL=http://localhost:3300,
 * `next start -p 3301`) against the REAL Go backend (`PORT=3300 ./tessera serve`,
 * read-only, no AI key set).
 *   node scripts/tessera/capture.mjs
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://localhost:3301";
const OUT = path.resolve("public/tessera");
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { await wait(1200); await page.screenshot({ path: path.join(OUT, `${name}.png`) }); console.log("shot", name); };

await page.goto(APP + "/", { waitUntil: "networkidle2" }); await wait(3500); await page.mouse.move(1550, 950);
await shot("01-landing");
const featY = await page.evaluate(() => {
  const el = [...document.querySelectorAll("h2,h3")].find((e) => /On-chain reconnaissance/i.test(e.textContent ?? ""));
  return el ? el.getBoundingClientRect().top + window.scrollY - 300 : 1000;
});
for (let y = 0; y <= featY; y += 300) { await page.evaluate((v) => window.scrollTo(0, v), y); await wait(200); }
await page.evaluate((v) => window.scrollTo(0, v), featY); await wait(2000);
await shot("02-features");

await page.goto(APP + "/dashboard", { waitUntil: "networkidle2" }); await wait(2500); await page.mouse.move(1550, 950);
await shot("03-dashboard");
const input = await page.$("input");
if (input) { await input.click(); await input.type("0xF977814e90dA44bFA03b6295A0616a897441aceC", { delay: 5 }); }
await page.mouse.move(1550, 950);
await shot("04-dashboard-addr");
await browser.close();
