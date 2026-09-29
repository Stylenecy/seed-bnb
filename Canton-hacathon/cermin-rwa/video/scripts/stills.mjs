// Bundle the composition ONCE, then render a list of still frames — far faster
// than invoking `remotion still` per frame (which re-bundles each time).
// Usage: node scripts/stills.mjs <outDir> <frame1> <frame2> ...
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const outDir = process.argv[2];
const frames = process.argv.slice(3).map((f) => parseInt(f, 10));

const serveUrl = await bundle({
  entryPoint: path.join(root, "src", "index.ts"),
  onProgress: () => {},
});
const composition = await selectComposition({ serveUrl, id: "Main" });
console.log(`bundled. rendering ${frames.length} stills → ${outDir}`);

for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, output, frame, overwrite: true });
  console.log(`  ok f${frame}`);
}
console.log("done");
