import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(projectRoot, "dist");
const source = resolve(projectRoot, "src");
const samples = resolve(projectRoot, "sample-data");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "sample-data"), { recursive: true });

for (const file of ["index.html", "styles.css", "app.js", "core.js", "benchmark.js"]) {
  await cp(resolve(source, file), resolve(dist, file));
}

for (const file of ["hiring_board.csv", "adversarial.csv"]) {
  await cp(resolve(samples, file), resolve(dist, "sample-data", file));
}

console.log("Built static site in dist/");
