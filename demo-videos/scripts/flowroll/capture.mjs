/**
 * flowroll screen capture — drives the REAL Flowroll frontend (next build with
 * .env.bsc-testnet, live BSC-testnet addresses, served by `next start -p 3280`)
 * in headless Chrome. A READ-ONLY injected EIP-1193 wallet reports one of the
 * real smoke-run accounts from VERIFY-BNB.md, so every number on screen is a
 * live chain read. It cannot sign or send anything.
 *
 *   WHO=employer|employee node scripts/flowroll/capture.mjs <route> [name] [scrollY]
 */
import puppeteer from "puppeteer-core";
import path from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3280";
const OUT = path.resolve(process.env.OUT ?? "public/flowroll/raw");
const WHO = process.env.WHO ?? "employer";
const ADDR = {
  employer: "0xE5ACd0f4c449B783f1DddB0C1C6932409b71D33a",
  employee: "0x7e13A02a488F48901e7D32Cb21D48bf43719D5C0",
  none: null,
}[WHO];

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--force-dark-mode", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1.2 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.evaluateOnNewDocument((addr, role) => {
  if (!addr) return;
  window.ethereum = {
    isMetaMask: true,
    on: () => {},
    removeListener: () => {},
    request: async ({ method }) => {
      switch (method) {
        case "eth_accounts":
        case "eth_requestAccounts":
          return [addr];
        case "eth_chainId":
          return "0x61";
        case "net_version":
          return "97";
        case "wallet_switchEthereumChain":
        case "wallet_addEthereumChain":
        case "wallet_requestPermissions":
          return null;
        default:
          throw Object.assign(new Error(`read-only demo wallet: ${method}`), { code: 4200 });
      }
    },
  };
  try { localStorage.setItem("wagmi.recentConnectorId", '"injected"'); localStorage.setItem("wagmi.injected.connected", "true");
    localStorage.setItem("flowroll-auth", JSON.stringify({ state: { role: role, lastAddress: addr }, version: 0 })); } catch {}
}, ADDR, WHO);
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text().slice(0, 160)); });

const route = process.argv[2] ?? "/";
const name = process.argv[3] ?? `x${route.replace(/[^a-z0-9]+/gi, "-")}-${WHO}`;
const scrollY = Number(process.argv[4] ?? 0);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(APP + route, { waitUntil: "networkidle2", timeout: 60000 });
await wait(Number(process.env.WAIT ?? 7000));
if (process.env.WAITFOR) {
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate((t) => document.body.innerText.includes(t), process.env.WAITFOR)) break;
    await wait(1000);
  }
  await wait(1500);
}
if (process.env.CLICK) {
  const ok = await page.evaluate((src) => {
    const rx = new RegExp(src, "i");
    const els = [...document.querySelectorAll("button, a, [role=button], [role=tab]")].filter((e) => rx.test((e.innerText || "").trim()) && e.offsetParent !== null);
    const el = els.sort((a, b) => a.innerText.length - b.innerText.length)[0];
    if (!el) return false;
    el.click();
    return true;
  }, process.env.CLICK);
  console.log("click", process.env.CLICK, ok);
  await wait(4000);
}
if (process.env.TYPE) {
  const [sel, text] = process.env.TYPE.split("|");
  await page.click(sel);
  await page.keyboard.type(text, { delay: 20 });
  await wait(600);
}
if (scrollY) { await page.evaluate((y) => { window.scrollTo(0, y); document.querySelector("main")?.scrollTo?.(0, y); }, scrollY); await wait(800); }
await page.screenshot({ path: path.join(OUT, `${name}.png`) });
console.log("shot", name, page.url(), await page.evaluate(() => document.body.innerText.slice(0, 600).replace(/\s+/g, " ")));
await browser.close();
