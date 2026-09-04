#!/usr/bin/env node
/** Local/Grok-style preview helper.
 *
 * Usage:
 *   npm run sandbox        # build + start preview on 8081
 *   npm run sandbox:smoke  # smoke test an already running preview
 */
import { spawn } from "node:child_process";

const mode = process.argv[2] ?? "start";
const run = (cmd, args) => {
  const p = spawn(cmd, args, { stdio: "inherit", env: process.env });
  p.on("exit", (code) => process.exit(code ?? 1));
};

if (mode === "start") {
  run("npm", ["run", "build:native"]);
} else if (mode === "smoke") {
  run("node", ["scripts/browser-smoke.mjs", "--url", "http://127.0.0.1:8081/"]);
} else {
  console.error("Usage: npm run sandbox | npm run sandbox:smoke");
  process.exit(2);
}
