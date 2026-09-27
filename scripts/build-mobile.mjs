import { nodeResolve } from "@rollup/plugin-node-resolve";
import { rollup } from "rollup";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "www");
const assets = [
  "index.html",
  "styles.css",
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

const firebaseModules = new Map([
  ["https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js", "firebase/app"],
  ["https://www.gstatic.com/firebasejs/10.13.1/firebase-app-check.js", "firebase/app-check"],
  ["https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js", "firebase/auth"],
  ["https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js", "firebase/firestore"],
  ["https://www.gstatic.com/firebasejs/10.13.1/firebase-functions.js", "firebase/functions"]
]);
let applicationSource = await readFile(resolve(root, "app.js"), "utf8");
for (const [remoteUrl, packageName] of firebaseModules) {
  applicationSource = applicationSource.replaceAll(remoteUrl, packageName);
}
const nativeEntry = resolve(root, "capacitor-app-entry.js");
try {
  await writeFile(nativeEntry, applicationSource, "utf8");
  const bundle = await rollup({
    input: nativeEntry,
    plugins: [nodeResolve({ browser: true })]
  });
  await bundle.write({ file: resolve(output, "app.js"), format: "es", sourcemap: false });
  await bundle.close();
} finally {
  await rm(nativeEntry, { force: true });
}

console.log(`Prepared ${assets.length + 1} offline web assets in ${output}`);
