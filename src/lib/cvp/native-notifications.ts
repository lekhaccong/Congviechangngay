import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { liveQuery } from "dexie";
import { toast } from "sonner";
import { getDb } from "./db";
import { planTaskReminders } from "./notification-plan";

export const isNativeNotifications = () => Capacitor.getPlatform() === "android";
const channelId = "cvp-reminders";
let queue: Promise<void> = Promise.resolve();
let started = false;
let warned = false;

async function channel() {
  await LocalNotifications.createChannel({ id: channelId, name: "Nhắc công việc", importance: 4, vibration: true });
}

export function syncNativeReminders(): Promise<void> {
  if (!isNativeNotifications()) return Promise.resolve();
  const operation = queue.catch(() => {}).then(async () => {
    if ((await LocalNotifications.checkPermissions()).display !== "granted") return;
    await channel();
    const planned = planTaskReminders(await getDb().tasks.toArray(), Date.now());
    const pending = (await LocalNotifications.getPending()).notifications.filter((n) => n.extra?.cvpTask === true);
    const desired = new Map(planned.map((item) => [item.key, item]));
    const obsolete = pending.filter((n) => {
      const item = desired.get(n.extra?.key);
      return !item || n.extra?.at !== item.at || n.body !== item.body;
    });
    if (obsolete.length) await LocalNotifications.cancel({ notifications: obsolete.map(({ id }) => ({ id })) });
    const kept = pending.filter((n) => !obsolete.includes(n));
    const used = new Set(kept.map((n) => n.id));
    let nextId = 1000;
    const notifications = planned.filter((item) => !kept.some((n) => n.extra?.key === item.key)).map((item) => {
      while (used.has(nextId)) nextId++;
      const id = nextId++;
      used.add(id);
      return { id, title: item.title, body: item.body, channelId,
        schedule: { at: new Date(item.at), allowWhileIdle: true },
        extra: { cvpTask: true, key: item.key, at: item.at, recordId: item.recordId } };
    });
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  });
  queue = operation;
  return operation;
}

export function startNativeReminders() {
  if (!isNativeNotifications() || started) return;
  started = true;
  const refresh = () => void syncNativeReminders().catch(() => {
    if (!warned) { warned = true; toast.error("Chưa hẹn được thông báo. Kiểm tra quyền trong Cài đặt."); }
  });
  liveQuery(() => getDb().tasks.toArray()).subscribe({ next: refresh, error: () => refresh() });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  void LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
    const recordId = event.notification.extra?.recordId;
    if (typeof recordId === "string") window.location.assign(`/tasks/${encodeURIComponent(recordId)}`);
  });
}

export async function showNativeNotification(title: string, body: string) {
  if ((await LocalNotifications.checkPermissions()).display !== "granted") return;
  await channel();
  await LocalNotifications.schedule({ notifications: [{ id: Math.floor(Math.random() * 1_000_000) + 1_000_000, title, body, channelId }] });
}

export async function testNativeNotification() {
  await channel();
  await LocalNotifications.schedule({ notifications: [{ id: 42, title: "CongViecPro · Thông báo thử", body: "Thông báo Android đã hoạt động.", channelId,
    schedule: { at: new Date(Date.now() + 10_000), allowWhileIdle: true } }] });
}

export async function clearNativeReminders() {
  if (!isNativeNotifications()) return;
  await queue.catch(() => {});
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel(pending);
  await LocalNotifications.removeAllDeliveredNotifications();
}
