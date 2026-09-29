/**
 * equinox screen capture — the REAL Equinox frontend (next build with
 * frontend/.env.bsc-testnet, `next start -p 3230`). NOTE: the frontend is
 * MOCK DATA only (no chain wiring yet), so every capture is labelled
 * "UI preview (mock data)" in the video.
 *   node scripts/equinox/capture.mjs [outDir]
 * Mock auth flags live in localStorage (eqx.signed-in / eqx.has-pos).
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3230";
const OUT = process.argv[2] ?? path.resolve("public/equinox/raw");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

const shot = async (name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("shot", name);
};
const go = async (route, wait = 3500) => {
  await page.goto(`${APP}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(wait);
};

// Landing (signed out) + scroll positions.
await go("/");
await shot("landing");
for (let i = 1; i <= 4; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 1080);
  await sleep(4000);
  await shot(`landing-${i}`);
}

// Signed in, no position → empty dashboard + onboarding.
await page.evaluate(() => {
  localStorage.setItem("eqx.signed-in", "1");
  localStorage.removeItem("eqx.has-pos");
});
await go("/dashboard");
await shot("dash-empty");
await go("/onboarding");
await shot("onb-0");

// Full dashboard (mock position).
await page.evaluate(() => {
  localStorage.setItem("eqx.signed-in", "1");
  localStorage.setItem("eqx.has-pos", "1");
});
await go("/dashboard", 8000);
await shot("dash");
for (let i = 1; i <= 2; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 900);
  await sleep(4000);
  await shot(`dash-${i}`);
}
await go("/withdraw");
await shot("withdraw");
await go("/settings");
await shot("settings");
await browser.close();
console.log("done");
