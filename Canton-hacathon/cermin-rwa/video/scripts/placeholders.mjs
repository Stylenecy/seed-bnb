#!/usr/bin/env node
/**
 * Safety net: generate a VALID silent placeholder for any missing audio file
 * and a 1×1 PNG for any missing image, so `remotion render` never breaks on a
 * missing asset. Real assets replace these with zero code changes.
 *
 * All real files are expected to exist already — in that case this is a no-op.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public");

// A genuine 1×1 transparent PNG.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Expected audio assets and their approximate durations (seconds). */
const AUDIO = [
  ["audio/bring-it-on-airstream-main-version-41938-01-18.mp3", 78.75],
  ["audio/sfx/whoosh.mp3", 1.06],
  ["audio/sfx/chime.mp3", 1.56],
  ["audio/sfx/click.mp3", 0.36],
  ["audio/sfx/riser.mp3", 3.05],
];

/** Expected image assets. */
const IMAGES = [
  "screens/landing-hero.png",
  "screens/landing-full.png",
  "screens/onboarding-1.png",
  "screens/dashboard-healthy.png",
  "screens/dashboard-healthy-full.png",
  "screens/dashboard-warning.png",
  "screens/dashboard-rescued.png",
  "screens/dashboard-rescued-full.png",
  "screens/borrow-top.png",
  "screens/borrow-strategies.png",
  "screens/vault.png",
  "screens/simulate-before.png",
  "screens/simulate-after.png",
  "screens/mobile-landing.png",
  "screens/mobile-dashboard.png",
  "images/mascot-watch.webp",
  "images/mascot-shield.webp",
];

const hasFfmpeg = (() => {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

/** Minimal valid silent 16-bit PCM mono WAV, used only if ffmpeg is absent. */
const silentWav = (seconds) => {
  const rate = 44100;
  const samples = Math.max(1, Math.round(rate * seconds));
  const dataLen = samples * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataLen, 40);
  return buf;
};

let made = 0;

for (const [rel, dur] of AUDIO) {
  const p = join(publicDir, rel);
  if (existsSync(p)) continue;
  mkdirSync(dirname(p), { recursive: true });
  if (hasFfmpeg) {
    const codec = p.endsWith(".m4a") ? ["-c:a", "aac"] : ["-c:a", "libmp3lame"];
    execFileSync(
      "ffmpeg",
      ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", String(dur), ...codec, p],
      { stdio: "ignore" },
    );
  } else {
    writeFileSync(p, silentWav(dur));
  }
  console.log("placeholder (audio):", rel);
  made++;
}

for (const rel of IMAGES) {
  const p = join(publicDir, rel);
  if (existsSync(p)) continue;
  mkdirSync(dirname(p), { recursive: true });
  if (rel.endsWith(".webp") && hasFfmpeg) {
    execFileSync(
      "ffmpeg",
      ["-y", "-f", "lavfi", "-i", "color=c=0x0a0c10:s=1x1", "-frames:v", "1", p],
      { stdio: "ignore" },
    );
  } else {
    writeFileSync(p, PNG_1x1);
  }
  console.log("placeholder (image):", rel);
  made++;
}

console.log(made === 0 ? "All assets present — no placeholders needed." : `Generated ${made} placeholder(s).`);
