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

async function nativeOneSignal() {
  const { default: OneSignal } = await import("@onesignal/capacitor-plugin");
  return OneSignal;
}

function normalizeBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

async function initializeNative() {
  const OneSignal = await nativeOneSignal();
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
  if (!initialized) {
    initialized = (isNativeAndroid() ? initializeNative() : initializeWeb()).catch((error) => {
      // A native bridge can still be starting during the first React render.
      // Do not permanently cache that failure; the login/button path must retry.
      initialized = null;
      throw error;
    });
  }
  return initialized;
}

export async function identifyPushUser(userId: string, role: string) {
  if (!appId) return;
  await initializePush();
  if (isNativeAndroid()) {
    const OneSignal = await nativeOneSignal();
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
    const OneSignal = await nativeOneSignal();
    OneSignal.logout();
    return;
  }
  await withWebSdk((oneSignal) => oneSignal.logout());
}

export async function requestPushPermission(): Promise<boolean> {
  if (!appId) throw new Error("Bản build chưa có VITE_ONESIGNAL_APP_ID");
  await initializePush();
  if (isNativeAndroid()) {
    const OneSignal = await nativeOneSignal();
    const accepted = await OneSignal.Notifications.requestPermission(true);
    if (!accepted) return false;
    OneSignal.User.pushSubscription.optIn();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await OneSignal.User.pushSubscription.getIdAsync()) return true;
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    throw new Error("Đã cấp quyền nhưng OneSignal chưa tạo Subscription ID. Hãy mở lại ứng dụng và thử lại.");
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
