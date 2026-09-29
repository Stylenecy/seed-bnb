/**
 * liber screen capture — drives the REAL Liber frontend (`next build` with
 * NEXT_PUBLIC_CHAIN_ID=97 + the live BSC-testnet MockUSDC 0x2116…cC97 +
 * publicnode RPC) against the real Hono backend (throwaway Postgres) in
 * headless Chrome. Ports: app 3260, api 3261, postgres 3262.
 *
 *   node scripts/liber/capture.mjs fresh      # new local wallet → 202 awaiting_funding
 *   node scripts/liber/capture.mjs funded     # smoke wallet via read-only injected provider → 201 → home 995
 *
 * The "funded" persona injects a READ-ONLY EIP-1193 provider that only reports
 * the smoke-test address (VERIFY-BNB.md deployer); it cannot sign anything.
 * The pay page is fed the project's own demo QRIS clip as a fake camera.
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://localhost:3260";
const OUT = path.resolve("public/liber");
const SMOKE_WALLET = "0xE2D654a82893c5F97A40332D0f0ACb6Ad34318b5";
const QRIS_Y4M = "/Users/kiel/Documents/Hacathon/seed-bnb-indo/stellar-apac/video/assets/demo-qris.y4m";
fs.mkdirSync(OUT, { recursive: true });

const step = process.argv[2] ?? "fresh";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  userDataDir: path.resolve(`scripts/liber/.chrome-profile-${step === "after" ? "funded" : step}`),
  args: [
    "--hide-scrollbars",
    "--lang=en-US",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-video-capture=${QRIS_Y4M}`,
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text().slice(0, 200)); });

if (step === "funded" || step === "after") {
  await page.evaluateOnNewDocument((addr) => {
    window.ethereum = {
      on: () => {},
      removeListener: () => {},
      request: async ({ method }) => {
        if (method === "eth_accounts" || method === "eth_requestAccounts") return [addr];
        if (method === "eth_chainId") return "0x61";
        if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
        throw Object.assign(new Error(`read-only demo provider: ${method}`), { code: 4200 });
      },
    };
  }, SMOKE_WALLET);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name, full = false) => {
  await wait(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log("shot", name, page.url());
};
const clickText = async (re) => {
  const ok = await page.evaluate((src) => {
    const rx = new RegExp(src, "i");
    const els = [...document.querySelectorAll("button, a")].filter((e) => rx.test((e.innerText || "").trim()) && e.offsetParent !== null);
    const el = els.sort((a, b) => a.innerText.length - b.innerText.length)[0];
    if (!el) return false;
    el.click();
    return true;
  }, re.source);
  console.log("click", re, ok);
  return ok;
};

if (step === "fresh") {
  await page.goto(APP + "/", { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP + "/", { waitUntil: "networkidle2" });
  await wait(1200);
  await shot("01-landing");
  await shot("01-landing-full", true);
  await page.goto(APP + "/onboarding", { waitUntil: "networkidle2" });
  await wait(1000);
  await shot("02-onboarding");
  await clickText(/^create new wallet$/);
  await wait(5000);
  await shot("03-awaiting-funding");
  console.log("fresh wallet", await page.evaluate(() => localStorage.getItem("liber:wallet:publicKey")));
} else if (step === "funded") {
  await page.goto(APP + "/onboarding", { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP + "/onboarding", { waitUntil: "networkidle2" });
  await wait(800);
  await clickText(/^connect wallet$/);
  await wait(6000);
  console.log("after connect", page.url(), await page.evaluate(() => localStorage.getItem("liber:userId")));
  await wait(3000);
  await shot("04-home");
  await page.goto(APP + "/profile", { waitUntil: "networkidle2" });
  await wait(4000);
  await shot("05-profile");
  await shot("05-profile-full", true);
  // type 5 into the top-up amount (not submitted: the provider is read-only)
  const amt = await page.$('input[placeholder="Amount (USDC)"]');
  if (amt) {
    await amt.scrollIntoView();
    await amt.type("5", { delay: 40 });
    await wait(400);
    await shot("06-topup");
  }
  await page.goto(APP + "/history", { waitUntil: "networkidle2" });
  await wait(3500);
  await shot("07-history");
  await page.goto(APP + "/pay", { waitUntil: "networkidle2" });
  await wait(1500);
  await shot("08-scan");
  await wait(9000);
  await shot("09-quote");
}
if (step === "after") {
  // same funded profile, after the scan was logged: home + history now show both entries
  await page.goto(APP + "/home", { waitUntil: "networkidle2" });
  await wait(4000);
  await shot("04-home");
  await page.goto(APP + "/history", { waitUntil: "networkidle2" });
  await wait(3500);
  await shot("07-history");
}
await browser.close();
