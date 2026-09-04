#!/usr/bin/env node
/**
 * Idempotent Android manifest / gradle patches so the APK can use camera,
 * files, and notifications. Safe to run after every `npx cap sync`.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const android = path.join(root, "android");

async function read(p) {
  return readFile(p, "utf8");
}
async function write(p, s) {
  await writeFile(p, s);
  console.log("[android] patched", path.relative(root, p));
}

const manifestPath = path.join(android, "app/src/main/AndroidManifest.xml");
let manifest = await read(manifestPath);

const permissions = [
  "android.permission.CAMERA",
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.MODIFY_AUDIO_SETTINGS",
  "android.permission.RECORD_AUDIO",
  "android.permission.VIBRATE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_EXTERNAL_STORAGE",
];

for (const perm of permissions) {
  const tag = `<uses-permission android:name="${perm}" />`;
  if (!manifest.includes(`android:name="${perm}"`)) {
    manifest = manifest.replace(
      "<application",
      `${tag}\n    <application`,
    );
  }
}

if (!manifest.includes("android.hardware.camera")) {
  manifest = manifest.replace(
    "<application",
    `<uses-feature android:name="android.hardware.camera" android:required="false" />\n    <application`,
  );
}

if (!manifest.includes("android:hardwareAccelerated")) {
  manifest = manifest.replace("<application", `<application\n        android:hardwareAccelerated="true"`);
}
if (!manifest.includes("android:largeHeap")) {
  manifest = manifest.replace("<application", `<application\n        android:largeHeap="true"`);
}
if (!manifest.includes("android:usesCleartextTraffic")) {
  manifest = manifest.replace("<application", `<application\n        android:usesCleartextTraffic="true"`);
}

if (!manifest.includes("android:windowSoftInputMode")) {
  manifest = manifest.replace(
    "<activity",
    `<activity\n            android:windowSoftInputMode="adjustResize"`,
  );
}

await write(manifestPath, manifest);

const appGradle = path.join(android, "app/build.gradle");
let gradle = await read(appGradle);
gradle = gradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "pro.congviec.app"');
if (!gradle.includes("versionCode")) {
  gradle = gradle.replace(
    "defaultConfig {",
    `defaultConfig {\n        versionCode 1\n        versionName "1.1.1"`,
  );
} else {
  gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "1.1.1"');
}
gradle = gradle.replace(
  /minSdkVersion\s+24\.ext\.minSdkVersion/,
  "minSdkVersion rootProject.ext.minSdkVersion",
);
await write(appGradle, gradle);

const stringsPath = path.join(android, "app/src/main/res/values/strings.xml");
try {
  let strings = await read(stringsPath);
  strings = strings.replace(
    /<string name="app_name">[^<]*<\/string>/,
    `<string name="app_name">CongViecPro</string>`,
  );
  strings = strings.replace(
    /<string name="title_activity_main">[^<]*<\/string>/,
    `<string name="title_activity_main">CongViecPro</string>`,
  );
  strings = strings.replace(
    /<string name="package_name">[^<]*<\/string>/,
    `<string name="package_name">pro.congviec.app</string>`,
  );
  strings = strings.replace(
    /<string name="custom_url_scheme">[^<]*<\/string>/,
    `<string name="custom_url_scheme">pro.congviec.app</string>`,
  );
  await write(stringsPath, strings);
} catch {
  /* optional */
}

const colorsDir = path.join(android, "app/src/main/res/values");
await mkdir(colorsDir, { recursive: true });
const colorsPath = path.join(colorsDir, "colors.xml");
try {
  let colors = await read(colorsPath);
  if (!colors.includes("colorPrimary")) {
    colors = colors.replace(
      "</resources>",
      `    <color name="colorPrimary">#0C0D0F</color>\n    <color name="colorPrimaryDark">#0C0D0F</color>\n    <color name="colorAccent">#D6D3CB</color>\n</resources>`,
    );
    await write(colorsPath, colors);
  }
} catch {
  await write(
    colorsPath,
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#0C0D0F</color>
    <color name="colorPrimaryDark">#0C0D0F</color>
    <color name="colorAccent">#D6D3CB</color>
</resources>
`,
  );
}

console.log("[android] patch complete");
