import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "www");
const assets = [
  "index.html",
  "styles.css",
  "app.js",
  "firebase-config.js",
  "logo.png",
  "manifest.webmanifest",
  "sw.js"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const asset of assets) {
  await cp(resolve(root, asset), resolve(output, asset));
}

console.log(`Prepared ${assets.length} web assets in ${output}`);
