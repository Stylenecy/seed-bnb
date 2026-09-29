/**
 * iusd-pay screen capture — drives the REAL iUSD Pay app (built with
 * `vite build --mode bsc-testnet`, live BSC-testnet addresses) in headless
 * Chrome via puppeteer-core, with a throwaway injected EIP-1193 wallet that
 * signs EIP-191 logins locally. The real API runs alongside (see KIT.md →
 * "Capturing screens"). Ports: app 3180, api 3181, postgres 3182.
 *
 *   node scripts/iusd-pay/capture.mjs <step> [outDir]
 */
import puppeteer from "puppeteer-core";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire("/Users/kiel/Documents/Hacathon/seed-bnb-indo/iusd-payment/packages/app/package.json");
const { privateKeyToAccount } = require("viem/accounts");

const APP = process.env.APP_URL ?? "http://127.0.0.1:3180";
const OUT = process.argv[3] ?? path.resolve("public/iusd-pay");
const WHO = process.env.WHO ?? "sender"; // separate throwaway wallet + chrome profile per persona
const KEYFILE = path.resolve(`scripts/iusd-pay/.throwaway-key-${WHO}`);
// Throwaway demo wallet (never funded with anything but test tokens; not a secret).
let pk = fs.existsSync(KEYFILE) ? fs.readFileSync(KEYFILE, "utf8").trim() : null;
if (!pk) {
  const { generatePrivateKey } = require("viem/accounts");
  pk = generatePrivateKey();
  fs.writeFileSync(KEYFILE, pk);
}
const account = privateKeyToAccount(pk);
console.log("demo wallet", account.address);

const MOBILE = { width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1600, height: 1000, deviceScaleFactor: 1.2 };

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  userDataDir: path.resolve(`scripts/iusd-pay/.chrome-profile-${WHO}`),
  args: ["--disable-web-security", "--hide-scrollbars", "--force-dark-mode", "--lang=en-US"],
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.exposeFunction("__demoSign", async (hex) => account.signMessage({ message: { raw: hex } }));
await page.evaluateOnNewDocument((addr) => {
  const listeners = {};
  window.ethereum = {
    isMetaMask: true,
    on: (ev, fn) => ((listeners[ev] ??= []).push(fn)),
    removeListener: () => {},
    request: async ({ method, params }) => {
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
          return null;
        case "personal_sign":
          return window.__demoSign(params[0]);
        default:
          throw Object.assign(new Error(`demo wallet: ${method} unsupported`), { code: 4200 });
      }
    },
  };
  try { localStorage.setItem("i18nextLng", "en"); } catch {}
}, account.address);
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text().slice(0, 200)); });

const shot = async (name) => {
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("shot", name, page.url());
};
const clickText = async (re) => {
  const ok = await page.evaluate((src) => {
    const rx = new RegExp(src, "i");
    const els = [...document.querySelectorAll("button, a, [role=button], div, span")].filter(
      (e) => rx.test((e.innerText || "").trim()) && e.offsetParent !== null,
    );
    // Deepest match wins.
    const el = els.sort((a, b) => a.innerText.length - b.innerText.length)[0];
    if (!el) return false;
    (el.closest("button, a, [role=button]") ?? el).click();
    return true;
  }, re.source);
  console.log("click", re, ok);
  return ok;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const step = process.argv[2] ?? "explore";
const view = process.env.VIEW === "desktop" ? DESKTOP : MOBILE;
await page.setViewport(view);

if (step === "explore") {
  await page.goto(APP + "/", { waitUntil: "networkidle2" });
  await shot("x-landing");
  await clickText(/^connect$/);
  await wait(4000);
  await shot("x-after-connect");
} else if (step === "goto") {
  for (const route of process.argv.slice(4)) {
    await page.goto(APP + route, { waitUntil: "networkidle2" });
    await wait(3000);
    await shot(`x${route.replace(/[^a-z0-9]+/gi, "-")}`);
  }
} else if (step === "script") {
  // Run an arbitrary scripted flow from a file (JSON list of actions).
  const actions = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
  for (const a of actions) {
    if (a.goto) await page.goto(APP + a.goto, { waitUntil: "networkidle2" });
    if (a.click) await clickText(new RegExp(a.click, "i"));
    if (a.clickSel) await page.click(a.clickSel);
    if (a.type) { await page.focus(a.type.sel); await page.keyboard.type(a.type.text, { delay: 30 }); }
    if (a.eval) console.log("eval", await page.evaluate(a.eval));
    if (a.wait) await wait(a.wait);
    if (a.shot) await shot(a.shot);
  }
}
await browser.close();
