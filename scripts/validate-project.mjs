#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const required = [
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "capacitor.config.ts",
  ".github/workflows/build.yml",
  "src/lib/cvp/db.ts",
  "src/lib/cvp/backup.ts",
  "src/lib/cvp/repo.ts",
];
const missing = required.filter((p) => !existsSync(join(root, p)));
if (missing.length) {
  console.error("Missing required project files:\n" + missing.map((x) => `- ${x}`).join("\n"));
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
if (lock.lockfileVersion !== 3) console.warn(`Warning: package-lock lockfileVersion=${lock.lockfileVersion}`);
for (const script of ["build", "build:native", "typecheck", "test", "sandbox", "sandbox:smoke"]) {
  if (!pkg.scripts?.[script]) throw new Error(`Missing npm script: ${script}`);
}
console.log(`CongViecPro project validation OK — ${pkg.name} ${pkg.version ?? "private"}`);
