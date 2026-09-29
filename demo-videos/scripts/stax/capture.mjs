/**
 * stax screen capture — drives the REAL Stax web app (next start with
 * web/.env.bsc-testnet on :3200) in headless Chrome. /demo mounts the real
 * LiteApp screens with demo data (no Privy); `?play=invest|vera` auto-plays.
 *   node scripts/stax/capture.mjs <landing|invest|vera> [outDir]
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3200";
const step = process.argv[2] ?? "invest";
const OUT = process.argv[3] ?? path.resolve("public/stax/raw");
fs.mkdirSync(OUT, { recursive: true });
const MOBILE = { width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (step === "landing") {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`${APP}/`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, "landing.png") });
  for (let i = 1; i <= 3; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * 1000);
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, `landing-${i}.png`) });
  }
} else {
  await page.setViewport(MOBILE);
  await page.goto(`${APP}/demo?mode=dark&play=${step}`, { waitUntil: "networkidle2", timeout: 60000 });
  const t0 = Date.now();
  for (let i = 0; i < 40; i++) {
    await page.screenshot({ path: path.join(OUT, `${step}-${String(i).padStart(2, "0")}.png`) });
    const wait = 400 - ((Date.now() - t0) % 400);
    await sleep(wait);
  }
}
await browser.close();
console.log("done", step);
