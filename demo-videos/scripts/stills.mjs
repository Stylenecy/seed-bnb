/**
 * Render several stills of a composition in one bundle pass.
 *   node scripts/stills.mjs <slug> <outDir> <frame|bar:K[.beat]> …
 * e.g. node scripts/stills.mjs iusd-pay out/stills 0 bar:4 bar:12.3
 * ("bar:K.B" uses the Bring-It-On grid by default; pass BPM/OFFSET env to override.)
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [slug, outDir, ...specs] = process.argv.slice(2);
const bpm = Number(process.env.BPM ?? 128.01);
const off = Number(process.env.OFFSET ?? 0.209);
const toFrame = (s) => {
  if (!s.startsWith("bar:")) return Number(s);
  const [k, b = "0"] = s.slice(4).split(".");
  return Math.round((off + (Number(k) * 4 + Number(b)) * (60 / bpm)) * 30) + Number(process.env.NUDGE ?? 0);
};
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: slug });
for (const s of specs) {
  const frame = toFrame(s);
  const output = path.join(outDir, `${slug}-${s.replace(":", "")}-f${frame}.png`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: "png" });
  console.log(output);
}
