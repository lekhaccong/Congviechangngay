import JSZip from "jszip";
import type { Table } from "dexie";
import { getDb, type CvpDB } from "./db";
import { nid } from "./ids";
import { writeAudit } from "./repo";
import {
  APP_NAME,
  BACKUP_VERSION,
  DB_VERSION,
  type BackupManifest,
  type ModuleKey,
} from "./types";

export { detectDuplicates } from "./dupes";

export const BACKUP_MODULES: { key: ModuleKey; label: string }[] = [
  { key: "employees", label: "Nhân sự" },
  { key: "groups", label: "Nhóm" },
  { key: "shifts", label: "Ca" },
  { key: "attendance", label: "Chấm công" },
  { key: "workBlocks", label: "Khối công việc" },
  { key: "tasks", label: "Công việc" },
  { key: "checklists", label: "Checklist" },
  { key: "checklistItems", label: "Mục checklist" },
  { key: "overtimes", label: "OT" },
  { key: "amhs", label: "AMH" },
  { key: "dataItems", label: "DATA" },
  { key: "goodsItems", label: "Hàng xuất" },
  { key: "lots", label: "Lot" },
  { key: "lotClosures", label: "Chốt Lot" },
  { key: "threeS", label: "3S / 3D" },
  { key: "abnormalities", label: "Bất thường" },
  { key: "auditLogs", label: "Nhật ký" },
  { key: "handovers", label: "Bàn giao" },
  { key: "notifications", label: "Thông báo" },
  { key: "settings", label: "Cài đặt" },
  { key: "photos", label: "Ảnh (metadata)" },
  { key: "blobs", label: "Ảnh (file)" },
];

const TABLE_FILE: Record<ModuleKey, string> = {
  employees: "employees.json",
  groups: "groups.json",
  shifts: "shifts.json",
  attendance: "attendance.json",
  workBlocks: "workBlocks.json",
  tasks: "tasks.json",
  checklists: "checklists.json",
  checklistItems: "checklistItems.json",
  photos: "photos.json",
  blobs: "blobs.json",
  auditLogs: "auditlog.json",
  overtimes: "ot.json",
  amhs: "amh.json",
  dataItems: "data.json",
  goodsItems: "goods.json",
  lots: "lots.json",
  lotClosures: "lotClosures.json",
  threeS: "threes.json",
  abnormalities: "abnormalities.json",
  notifications: "notifications.json",
  settings: "settings.json",
  handovers: "handovers.json",
};

export type RestoreMode = "overwrite" | "merge" | "skip";

export interface BackupPreview {
  manifest: BackupManifest;
  counts: Record<string, number>;
  valid: boolean;
  error?: string;
  zip: JSZip;
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function tableOf(db: CvpDB, key: ModuleKey): Table<{ id?: string; key?: string }, string> {
  return db[key] as unknown as Table<{ id?: string; key?: string }, string>;
}

export async function exportBackup(modules: ModuleKey[]): Promise<Blob> {
  const db = getDb();
  const zip = new JSZip();
  const payload: Record<string, unknown> = {};
  let imageCount = 0;

  for (const key of modules) {
    if (key === "blobs") continue;
    const allRows = await tableOf(db, key).toArray();
    // Safety ZIP references only belong to this device, not the exported archive.
    const rows = key === "settings" ? allRows.filter((row) => !row.key?.startsWith("autobackup:") && row.key !== "lastAutoBackupBlobId") : allRows;
    payload[key] = rows;
    zip.file(TABLE_FILE[key], JSON.stringify(rows));
  }

  if (modules.includes("blobs") || modules.includes("photos")) {
    const photos = modules.includes("photos")
      ? ((payload.photos as { blobId: string; id: string }[]) ?? (await db.photos.toArray()))
      : await db.photos.toArray();
    const images = zip.folder("images");
    for (const p of photos) {
      const blobRow = await db.blobs.get((p as { blobId: string }).blobId);
      if (!blobRow) continue;
      const ext = blobRow.mime.includes("png") ? "png" : "jpg";
      images?.file(`${blobRow.id}.${ext}`, blobRow.data);
      imageCount += 1;
    }
  }

  const checksum = await sha256(JSON.stringify(payload));
  const manifest: BackupManifest = {
    app: APP_NAME,
    backupVersion: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    databaseVersion: DB_VERSION,
    imageCount,
    checksum,
    modules,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("database.json", JSON.stringify({ version: DB_VERSION, modules }));
  await writeAudit({ action: "BACKUP", module: "backup", recordId: "full", newValue: manifest });
  return zip.generateAsync({ type: "blob" });
}

export async function parseBackup(file: Blob): Promise<BackupPreview> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    return {
      manifest: emptyManifest(),
      counts: {},
      valid: false,
      error: "Thiếu manifest.json",
      zip,
    };
  }
  const manifest = JSON.parse(await manifestFile.async("string")) as BackupManifest;
  if (manifest.app !== APP_NAME) {
    return { manifest, counts: {}, valid: false, error: "File không phải backup CongViecPro", zip };
  }
  if (manifest.backupVersion > BACKUP_VERSION) {
    return { manifest, counts: {}, valid: false, error: "Phiên bản backup mới hơn app", zip };
  }
  const counts: Record<string, number> = {};
  const payload: Record<string, unknown> = {};
  for (const key of manifest.modules ?? []) {
    if (key === "blobs") continue;
    const f = zip.file(TABLE_FILE[key]);
    if (!f) {
      return { manifest, counts, valid: false, error: `Thiếu ${TABLE_FILE[key]}`, zip };
    }
    try {
      const rows = JSON.parse(await f.async("string")) as unknown;
      if (!Array.isArray(rows)) throw new Error("dữ liệu không phải mảng");
      payload[key] = rows;
      counts[key] = rows.length;
    } catch {
      return { manifest, counts, valid: false, error: `Dữ liệu ${key} bị hỏng`, zip };
    }
  }
  const actualChecksum = await sha256(JSON.stringify(payload));
  if (manifest.checksum && actualChecksum !== manifest.checksum) {
    return {
      manifest,
      counts,
      valid: false,
      error: "Checksum SHA-256 không khớp — backup có thể đã bị thay đổi hoặc hỏng",
      zip,
    };
  }
  return { manifest, counts, valid: true, zip };
}

export async function restoreBackup(
  preview: BackupPreview,
  mode: RestoreMode,
  selected: ModuleKey[],
): Promise<void> {
  const db = getDb();
  const auto = await exportBackup(BACKUP_MODULES.map((m) => m.key));
  const autoName = `auto-before-restore-${Date.now()}`;
  const autoBlobId = nid();
  await db.settings.put({
    key: `autobackup:${autoName}`,
    value: autoBlobId,
  });
  await db.blobs.add({ id: autoBlobId, mime: "application/zip", data: auto, createdAt: Date.now() });
  await db.settings.put({ key: "lastAutoBackupBlobId", value: autoBlobId });

  // Keep only the latest 3 restore safety backups to prevent photo-heavy apps
  // from growing the local database indefinitely.
  const autoKeys = await db.settings.toArray();
  const backups = autoKeys
    .filter((s) => s.key.startsWith("autobackup:"))
    .sort((a, b) => a.key.localeCompare(b.key));
  const stale = backups.slice(0, Math.max(0, backups.length - 3));
  for (const item of stale) {
    const blobId = item.value;
    if (blobId) await db.blobs.delete(blobId);
    await db.settings.delete(item.key);
  }

  const safetySettings = (await db.settings.toArray()).filter((s) => s.key.startsWith("autobackup:") || s.key === "lastAutoBackupBlobId");
  await db.transaction("rw", db.tables, async () => {
    for (const key of selected) {
      if (key === "blobs") continue;
      const f = preview.zip.file(TABLE_FILE[key]);
      if (!f) continue;
      const imported = JSON.parse(await f.async("string")) as Array<{ id: string; key?: string }>;
      const rows = key === "settings" ? imported.filter((row) => !row.key?.startsWith("autobackup:") && row.key !== "lastAutoBackupBlobId") : imported;
      const table = tableOf(db, key);
      if (mode === "overwrite") {
        await table.clear();
        if (rows.length) await table.bulkAdd(rows as never[]);
      } else if (mode === "skip") {
        const existing = new Set((await table.toArray()).map((r) => (r as { id: string }).id));
        const fresh = rows.filter((r) => !existing.has(r.id));
        if (fresh.length) await table.bulkAdd(fresh as never[]);
      } else {
        for (const row of rows) {
          await table.put(row as never);
        }
      }
    }
    await db.settings.bulkPut(safetySettings);
  });

  if (selected.includes("blobs") || selected.includes("photos")) {
    const files = Object.keys(preview.zip.files).filter((n) => n.startsWith("images/") && !n.endsWith("/"));
    for (const name of files) {
      const f = preview.zip.file(name);
      if (!f) continue;
      const data = await f.async("blob");
      const id = name.split("/")[1]?.replace(/\.(jpg|jpeg|png|webp)$/i, "") ?? nid();
      const mime = name.endsWith(".png") ? "image/png" : "image/jpeg";
      const existing = await db.blobs.get(id);
      if (mode === "skip" && existing) continue;
      await db.blobs.put({ id, mime, data, createdAt: Date.now() });
    }
  }

  await writeAudit({
    action: "RESTORE",
    module: "backup",
    recordId: preview.manifest.createdAt,
    newValue: { mode, selected, autoBackup: autoName },
  });
}

function emptyManifest(): BackupManifest {
  return {
    app: APP_NAME,
    backupVersion: BACKUP_VERSION,
    createdAt: "",
    databaseVersion: DB_VERSION,
    imageCount: 0,
    checksum: "",
    modules: [],
  };
}

export function backupFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()].map((n) => String(n).padStart(2, "0")).join("-");
  return `congviecpro_backup_${y}-${m}-${d}_${time}_${date.getMilliseconds()}.zip`;
}
