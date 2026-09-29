/**
 * zero-arena screen capture — the REAL Zero Arena dashboard (zero-arena-fe,
 * `next start -p 3250` with .env.local = the BSC-testnet deploy of 2026-09-25).
 * Reads live BSC-testnet state (token 1, season 1) in the browser.
 *   node scripts/zero-arena/capture.mjs [outDir] [route...]
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3250";
const OUT = process.argv[2] ?? path.resolve("public/zero-arena/raw");
const ROUTES = process.argv.slice(3);
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  console:", m.text().slice(0, 200)); });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

const routes = ROUTES.length ? ROUTES : ["/", "/leaderboard", "/season", "/season/1"];
for (const r of routes) {
  const name = r === "/" ? "home" : r.replace(/^\//, "").replace(/\//g, "-");
  await page.goto(`${APP}${r}`, { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(Number(process.env.WAIT ?? 9000));
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  if (process.env.FULL) await page.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true });
  const links = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href^='/agent/'],a[href^='/season/']")].map((a) => a.getAttribute("href")))]);
  console.log("shot", name, "h=", h, links.join(" "));
}
await browser.close();
console.log("done");
