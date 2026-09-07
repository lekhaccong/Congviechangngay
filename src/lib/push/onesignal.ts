import { Capacitor } from "@capacitor/core";

const appId = String(import.meta.env.VITE_ONESIGNAL_APP_ID ?? "").trim();
const isNativeAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

type WebOneSignal = {
  init(options: Record<string, unknown>): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  User: { addTags(tags: Record<string, string>): Promise<void> };
  Notifications: { permission: boolean; requestPermission(): Promise<void> };
};

declare global {
  interface Window { OneSignalDeferred?: Array<(oneSignal: WebOneSignal) => void | Promise<void>> }
}

let initialized: Promise<void> | null = null;
let nativeClickListenerAdded = false;

function normalizeBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

async function initializeNative() {
  const { default: OneSignal } = await import("onesignal-cordova-plugin");
  OneSignal.initialize(appId);
  if (!nativeClickListenerAdded) {
    nativeClickListenerAdded = true;
    OneSignal.Notifications.addEventListener("click", (event) => {
      const route = (event.notification.additionalData as { route?: unknown } | undefined)?.route;
      if (typeof route === "string" && route.startsWith("/")) window.location.assign(route);
    });
  }
}

function loadWebSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-onesignal="true"]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.dataset.onesignal = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không tải được dịch vụ thông báo OneSignal"));
    document.head.appendChild(script);
  });
}

async function withWebSdk(action: (oneSignal: WebOneSignal) => void | Promise<void>) {
  window.OneSignalDeferred ||= [];
  window.OneSignalDeferred.push(action);
}

async function initializeWeb() {
  await loadWebSdk();
  const base = normalizeBase();
  await withWebSdk((oneSignal) => oneSignal.init({
    appId,
    serviceWorkerPath: `${base}push/onesignal/OneSignalSDKWorker.js`,
    serviceWorkerParam: { scope: `${base}push/onesignal/` },
    notifyButton: { enable: false },
  }));
}

export function pushConfigured() { return Boolean(appId); }

export function initializePush(): Promise<void> {
  if (!appId || typeof window === "undefined") return Promise.resolve();
  initialized ||= isNativeAndroid() ? initializeNative() : initializeWeb();
  return initialized;
}

export async function identifyPushUser(userId: string, role: string) {
  if (!appId) return;
  await initializePush();
  if (isNativeAndroid()) {
    const { default: OneSignal } = await import("onesignal-cordova-plugin");
    OneSignal.login(userId);
    OneSignal.User.addTags({ role, user_id: userId });
    return;
  }
  await withWebSdk(async (oneSignal) => {
    await oneSignal.login(userId);
    await oneSignal.User.addTags({ role, user_id: userId });
  });
}

export async function clearPushUser() {
  if (!appId) return;
  await initializePush();
  if (isNativeAndroid()) {
    const { default: OneSignal } = await import("onesignal-cordova-plugin");
    OneSignal.logout();
    return;
  }
  await withWebSdk((oneSignal) => oneSignal.logout());
}

export async function requestPushPermission(): Promise<boolean> {
  if (!appId) throw new Error("Bản build chưa có VITE_ONESIGNAL_APP_ID");
  await initializePush();
  if (isNativeAndroid()) {
    const { default: OneSignal } = await import("onesignal-cordova-plugin");
    return OneSignal.Notifications.requestPermission(true);
  }
  let granted = false;
  await new Promise<void>((resolve) => {
    void withWebSdk(async (oneSignal) => {
      await oneSignal.Notifications.requestPermission();
      granted = oneSignal.Notifications.permission;
      resolve();
    });
  });
  return granted;
}
