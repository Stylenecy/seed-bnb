/**
 * musashi screen capture — the REAL MUSASHI frontend (musashi/frontend,
 * `next start -p 3271` with .env.bsc-testnet) talking to the REAL Go daemon
 * (`musashi-core serve --addr 127.0.0.1:3270`, BSC testnet contracts).
 * Gate checks hit live BSC mainnet data (read-only).
 *   node scripts/musashi/capture.mjs [outDir]
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3271";
const OUT = process.argv[2] ?? path.resolve("public/musashi/raw");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
const ARIA = "0x5d3a12c42e5372b2cc3264ab3cdcf660a1555238";

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--lang=en-US"],
});
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  console:", m.text().slice(0, 160)); });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// The FE's baked-in RPC (publicnode) was timing out during capture; answer its
// JSON-RPC calls from the official BNB Chain testnet RPC instead (same chain 97).
const ALT_RPC = "https://bsc-testnet.bnbchain.org";
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!req.url().startsWith("https://bsc-testnet-rpc.publicnode.com")) return req.continue();
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
  if (req.method() === "OPTIONS") return req.respond({ status: 204, headers: cors });
  try {
    const r = await fetch(ALT_RPC, { method: "POST", headers: { "content-type": "application/json" }, body: req.postData() });
    req.respond({ status: 200, headers: cors, contentType: "application/json", body: await r.text() });
  } catch (e) { req.abort(); }
});
const shot = async (name) => { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); console.log("shot", name); };

// Landing
await page.goto(`${APP}/`, { waitUntil: "networkidle2", timeout: 90000 });
await sleep(4000);
await shot("01-landing");
for (const id of ["pipeline", "protocol"]) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: "start" }), id);
  await sleep(2500);
  await shot(`01-landing-${id}`);
}

// Dashboard
await page.goto(`${APP}/dashboard`, { waitUntil: "networkidle2", timeout: 90000 });
await sleep(6000);
await shot("02-dashboard");

const clickTab = async (label) => {
  await page.evaluate((l) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === l);
    b?.click();
  }, label);
  await sleep(4000);
};

const runGates = async (addr) => {
  await page.goto(`${APP}/dashboard`, { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(3000);
  const input = await page.$("input[placeholder^='Enter token address']");
  await input.click({ clickCount: 3 });
  await input.type(addr, { delay: 5 });
  await page.keyboard.press("Enter");
  await sleep(Number(process.env.GATE_WAIT ?? 12000));
};

await runGates(CAKE);
await shot("03-gates-cake");
await runGates(ARIA);
await shot("04-gates-aria");
await page.evaluate(() => window.scrollTo(0, 500));
await sleep(1000);
await shot("04-gates-aria-2");
await page.evaluate(() => window.scrollTo(0, 0));

await page.goto(`${APP}/dashboard`, { waitUntil: "networkidle2", timeout: 90000 });
await sleep(6000);
await clickTab("Ledger");
await sleep(4000);
await shot("05-ledger");
await page.evaluate(() => window.scrollTo(0, 500));
await sleep(1000);
await shot("05-ledger-2");
await page.evaluate(() => window.scrollTo(0, 0));
await clickTab("Strike");
await shot("06-strike");

await browser.close();
console.log("done");
