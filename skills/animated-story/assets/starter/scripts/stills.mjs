// Look-check stills (after claude-animated-shorts scripts/bridge-stills.mjs, MIT). Bundles once, renders JPEGs with WebGL via ANGLE.
// Run from the project root (needs @remotion/bundler + @remotion/renderer).
// usage: node scripts/stills.mjs <outPrefix> <frame,frame,...> <scale> <compositionId>   e.g. out/s/x_ 150,900,2400 0.4 MyVideo
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [prefix, frames, scale = "0.5", id] = process.argv.slice(2);
if (!prefix || !frames || !id) { console.error("usage: node scripts/stills.mjs <outPrefix> <frames> <scale> <compositionId>"); process.exit(1); }
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const chromiumOptions = { gl: "angle" };
const inputProps = { post: { audio: false, ...JSON.parse(process.env.POST || "{}") } };
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (process.env.ALL_LOGS || l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), chromiumOptions, inputProps, timeoutInMilliseconds: 180000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
