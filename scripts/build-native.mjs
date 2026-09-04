#!/usr/bin/env node
/**
 * Produce a static SPA folder at native-www/ for Capacitor / Android APK.
 * Used by `npm run build:native` and GitHub Actions.
 */
import { spawn } from "node:child_process";
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.NATIVE_BUILD = "1";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${path.join(root, "node_modules/.bin")}${path.delimiter}${process.env.PATH ?? ""}`,
      },
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

await run("node", ["scripts/with-app-env.mjs", "vite", "build"]);

const dest = path.join(root, "native-www");
const clientDir = path.join(root, "dist/client");

if (!(await exists(clientDir))) {
  throw new Error("Native build missing dist/client");
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(clientDir, dest, { recursive: true });

const indexPath = path.join(dest, "index.html");
const shellPath = path.join(dest, "_shell.html");

if (!(await exists(indexPath)) && (await exists(shellPath))) {
  await cp(shellPath, indexPath);
}

if (!(await exists(indexPath))) {
  throw new Error("Native build did not produce index.html or _shell.html");
}

let html = await readFile(indexPath);
html = Buffer.from(html.toString("utf8").replaceAll("\u0000", ""));
await writeFile(indexPath, html);

await writeFile(path.join(dest, ".built-from"), `${clientDir}\n`, "utf8");

const files = await readdir(dest);
console.log(`[native] webDir ready: native-www (${files.length} entries)`);
