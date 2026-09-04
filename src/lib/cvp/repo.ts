import { getDb } from "./db";
import { nid } from "./ids";
import { computeOtMinutes } from "./ot";
import { applyProgress, refreshTaskStatus } from "./progress";
import { useAppStore } from "./store";
import { formatDate, shiftWindow } from "./time";
import type {
  Abnormality,
  Amh,
  Attendance,
  AttendanceStatus,
  AuditAction,
  DataItem,
  Employee,
  GoodsItem,
  Group,
  Handover,
  Lot,
  Overtime,
  Task,
  ThreeSRecord,
  WorkBlock,
} from "./types";

function ctx() {
  const s = useAppStore.getState();
  return {
    userId: s.currentUserId ?? "system",
    userName: s.currentUserName || "Hệ thống",
    date: s.selectedDate,
    shiftId: s.selectedShiftId,
    otRound: s.otRoundMinutes,
  };
}

export async function writeAudit(input: {
  action: AuditAction;
  module: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  const db = getDb();
  const c = ctx();
  await db.auditLogs.add({
    id: nid(),
    userId: c.userId,
    userName: c.userName,
    action: input.action,
    module: input.module,
    recordId: input.recordId,
    oldValue: input.oldValue === undefined ? null : JSON.stringify(input.oldValue),
    newValue: input.newValue === undefined ? null : JSON.stringify(input.newValue),
    timestamp: Date.now(),
    date: c.date,
    shiftId: c.shiftId,
  });
}

export async function persistSetting(key: string, value: string): Promise<void> {
  await getDb().settings.put({ key, value });
}

export async function createEmployee(data: Omit<Employee, "id" | "createdAt" | "updatedAt">) {
  const db = getDb();
  const now = Date.now();
  const row: Employee = { ...data, id: nid(), createdAt: now, updatedAt: now };
  await db.transaction("rw", db.employees, db.auditLogs, async () => {
    await db.employees.add(row);
    await writeAudit({ action: "CREATE", module: "employees", recordId: row.id, newValue: row });
  });
  return row;
}

export async function updateEmployee(id: string, patch: Partial<Employee>) {
  const db = getDb();
  const old = await db.employees.get(id);
  if (!old) throw new Error("Không tìm thấy nhân sự");
  const next = { ...old, ...patch, id, updatedAt: Date.now() };
  await db.transaction("rw", db.employees, db.auditLogs, async () => {
    await db.employees.put(next);
    await writeAudit({ action: "UPDATE", module: "employees", recordId: id, oldValue: old, newValue: next });
  });
  return next;
}

export async function deleteEmployee(id: string) {
  const db = getDb();
  const old = await db.employees.get(id);
  await db.transaction("rw", db.employees, db.auditLogs, async () => {
    await db.employees.delete(id);
    await writeAudit({ action: "DELETE", module: "employees", recordId: id, oldValue: old });
  });
}

export async function createGroup(name: string) {
  const db = getDb();
  const max = (await db.groups.toArray()).reduce((m, g) => Math.max(m, g.order), 0);
  const row: Group = { id: nid(), name, order: max + 1 };
  await db.groups.add(row);
  await writeAudit({ action: "CREATE", module: "groups", recordId: row.id, newValue: row });
  return row;
}

export async function renameGroup(id: string, name: string) {
  const db = getDb();
  const old = await db.groups.get(id);
  await db.groups.update(id, { name });
  await writeAudit({ action: "UPDATE", module: "groups", recordId: id, oldValue: old, newValue: { name } });
}

export async function deleteGroup(id: string) {
  const db = getDb();
  const used = await db.employees.where("groupId").equals(id).count();
  if (used > 0) throw new Error("Nhóm đang có nhân sự, không thể xóa");
  const old = await db.groups.get(id);
  await db.groups.delete(id);
  await writeAudit({ action: "DELETE", module: "groups", recordId: id, oldValue: old });
}

export async function createBlock(name: string) {
  const db = getDb();
  const max = (await db.workBlocks.toArray()).reduce((m, g) => Math.max(m, g.order), 0);
  const row: WorkBlock = { id: nid(), name, order: max + 1 };
  await db.workBlocks.add(row);
  await writeAudit({ action: "CREATE", module: "workBlocks", recordId: row.id, newValue: row });
  return row;
}

export async function updateBlock(id: string, name: string) {
  await getDb().workBlocks.update(id, { name });
  await writeAudit({ action: "UPDATE", module: "workBlocks", recordId: id, newValue: { name } });
}

export async function deleteBlock(id: string) {
  const db = getDb();
  const used = await db.tasks.where("blockId").equals(id).count();
  if (used > 0) throw new Error("Khối đang có công việc, không thể xóa");
  await db.workBlocks.delete(id);
  await writeAudit({ action: "DELETE", module: "workBlocks", recordId: id });
}

export async function reorderBlocks(ids: string[]) {
  const db = getDb();
  const oldRows = await db.workBlocks.bulkGet(ids);
  await db.transaction("rw", db.workBlocks, db.auditLogs, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.workBlocks.update(ids[i]!, { order: i + 1 });
    }
    await writeAudit({
      action: "UPDATE",
      module: "workBlocks",
      recordId: "order",
      oldValue: oldRows.filter(Boolean).map((r) => ({ id: r!.id, order: r!.order })),
      newValue: ids.map((id, i) => ({ id, order: i + 1 })),
    });
  });
}

export async function checkIn(employeeId: string) {
  const db = getDb();
  const c = ctx();
  const now = Date.now();
  const shiftId = c.shiftId;
  if (!shiftId) throw new Error("Chưa chọn ca");
  const shift = await db.shifts.get(shiftId);
  if (!shift) throw new Error("Không tìm thấy ca");
  const existing = await db.attendance
    .where("[employeeId+date+shiftId]")
    .equals([employeeId, c.date, shiftId])
    .first();
  if (existing?.checkIn) throw new Error("Đã chấm vào ca này");
  const window = shiftWindow(c.date, shift);
  const grace = 5 * 60 * 1000;
  const status: AttendanceStatus = now > window.start.getTime() + grace ? "LATE" : "CHECKED_IN";
  const row: Attendance = existing
    ? { ...existing, checkIn: now, status, createdAt: existing.createdAt }
    : {
        id: nid(),
        employeeId,
        date: c.date,
        shiftId,
        checkIn: now,
        checkOut: null,
        status,
        otMinutes: 0,
        note: "",
        createdAt: now,
      };
  await db.transaction("rw", db.attendance, db.auditLogs, async () => {
    await db.attendance.put(row);
    await writeAudit({ action: "CHECK_IN", module: "attendance", recordId: row.id, newValue: row });
  });
  return row;
}

export async function checkOut(employeeId: string) {
  const db = getDb();
  const c = ctx();
  const now = Date.now();
  const shiftId = c.shiftId;
  if (!shiftId) throw new Error("Chưa chọn ca");
  const shift = await db.shifts.get(shiftId);
  if (!shift) throw new Error("Không tìm thấy ca");
  const existing = await db.attendance
    .where("[employeeId+date+shiftId]")
    .equals([employeeId, c.date, shiftId])
    .first();
  if (!existing?.checkIn) throw new Error("Chưa chấm vào");
  if (existing.checkOut) throw new Error("Đã chấm ra");
  const window = shiftWindow(c.date, shift);
  const grace = 5 * 60 * 1000;
  let status: AttendanceStatus = existing.status === "LATE" ? "LATE" : "PRESENT";
  let otMinutes = 0;
  if (now < window.end.getTime() - grace) status = "EARLY_LEAVE";
  if (now > window.end.getTime() + grace) {
    status = "OVERTIME";
    otMinutes = Math.round((now - window.end.getTime()) / 60000);
  }
  const next: Attendance = { ...existing, checkOut: now, status, otMinutes };
  await db.transaction("rw", db.attendance, db.auditLogs, async () => {
    await db.attendance.put(next);
    await writeAudit({ action: "CHECK_OUT", module: "attendance", recordId: next.id, newValue: next });
  });
  return next;
}

export async function markAbsent(employeeId: string, note: string) {
  const db = getDb();
  const c = ctx();
  const shiftId = c.shiftId;
  if (!shiftId) throw new Error("Chưa chọn ca");
  const existing = await db.attendance
    .where("[employeeId+date+shiftId]")
    .equals([employeeId, c.date, shiftId])
    .first();
  const row: Attendance = existing
    ? { ...existing, status: "ABSENT", note }
    : {
        id: nid(),
        employeeId,
        date: c.date,
        shiftId,
        checkIn: null,
        checkOut: null,
        status: "ABSENT",
        otMinutes: 0,
        note,
        createdAt: Date.now(),
      };
  await db.attendance.put(row);
  await writeAudit({ action: "UPDATE", module: "attendance", recordId: row.id, newValue: row });
  return row;
}

export async function createTask(data: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt" | "status" | "progress"> & { progress?: number }) {
  const now = Date.now();
  const row: Task = {
    ...data,
    id: nid(),
    progress: data.progress ?? 0,
    status: "TODO",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  const db = getDb();
  await db.transaction("rw", db.tasks, db.auditLogs, async () => {
    await db.tasks.add(row);
    await writeAudit({ action: "CREATE", module: "tasks", recordId: row.id, newValue: row });
  });
  return row;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const db = getDb();
  const old = await db.tasks.get(id);
  if (!old) throw new Error("Không tìm thấy công việc");
  const next = { ...old, ...patch, id, updatedAt: Date.now() };
  await db.transaction("rw", db.tasks, db.auditLogs, async () => {
    await db.tasks.put(next);
    await writeAudit({ action: "UPDATE", module: "tasks", recordId: id, oldValue: old, newValue: next });
  });
  return next;
}

export async function setTaskProgress(id: string, progress: number) {
  const db = getDb();
  const old = await db.tasks.get(id);
  if (!old) throw new Error("Không tìm thấy công việc");
  const now = Date.now();
  const applied = applyProgress(old, progress, now);
  const next: Task = { ...old, ...applied };
  await db.transaction("rw", db.tasks, db.auditLogs, async () => {
    await db.tasks.put(next);
    await writeAudit({
      action: applied.status === "COMPLETED" ? "COMPLETE" : "PROGRESS",
      module: "tasks",
      recordId: id,
      oldValue: { progress: old.progress, status: old.status },
      newValue: { progress: next.progress, status: next.status },
    });
  });
  return next;
}

export async function deleteTask(id: string) {
  const db = getDb();
  const old = await db.tasks.get(id);
  await db.transaction("rw", db.tasks, db.auditLogs, async () => {
    await db.tasks.delete(id);
    await writeAudit({ action: "DELETE", module: "tasks", recordId: id, oldValue: old });
  });
}

export async function refreshOverdueTasks() {
  const db = getDb();
  const now = Date.now();
  const open = await db.tasks.filter((t) => t.status !== "COMPLETED").toArray();
  for (const t of open) {
    const next = refreshTaskStatus(t, now);
    if (next !== t.status) {
      await db.transaction("rw", db.tasks, db.auditLogs, async () => {
        await db.tasks.update(t.id, { status: next, updatedAt: now });
        await writeAudit({
          action: "UPDATE",
          module: "tasks",
          recordId: t.id,
          oldValue: { status: t.status },
          newValue: { status: next, automatic: true },
        });
      });
    }
  }
}

export async function toggleChecklistItem(id: string, done: boolean) {
  const db = getDb();
  const c = ctx();
  const now = Date.now();
  const old = await db.checklistItems.get(id);
  await db.transaction("rw", db.checklistItems, db.auditLogs, async () => {
    await db.checklistItems.update(id, {
      done,
      completedAt: done ? now : null,
      completedBy: done ? c.userId : null,
    });
    await writeAudit({
      action: done ? "COMPLETE" : "UPDATE",
      module: "checklistItems",
      recordId: id,
      oldValue: old,
      newValue: { ...(old ?? {}), done },
    });
  });
}

export async function addChecklistItem(checklistId: string, label: string, extra?: { taskId?: string; threeSId?: string }) {
  const db = getDb();
  const siblings = await db.checklistItems.where("checklistId").equals(checklistId).count();
  const row = {
    id: nid(),
    checklistId,
    taskId: extra?.taskId ?? null,
    threeSId: extra?.threeSId ?? null,
    label,
    done: false,
    completedAt: null,
    completedBy: null,
    photoId: null,
    note: "",
    order: siblings + 1,
  };
  await db.transaction("rw", db.checklistItems, db.auditLogs, async () => {
    await db.checklistItems.add(row);
    await writeAudit({ action: "CREATE", module: "checklistItems", recordId: row.id, newValue: row });
  });
  return row;
}

export async function savePhoto(input: {
  ownerModule: string;
  ownerId: string;
  kind: string;
  blob: Blob;
  note?: string;
}) {
  const db = getDb();
  const blobId = nid();
  const photoId = nid();
  await db.transaction("rw", db.blobs, db.photos, db.auditLogs, async () => {
    await db.blobs.add({ id: blobId, mime: input.blob.type || "image/jpeg", data: input.blob, createdAt: Date.now() });
    await db.photos.add({
      id: photoId,
      ownerModule: input.ownerModule,
      ownerId: input.ownerId,
      kind: input.kind,
      blobId,
      note: input.note ?? "",
      createdAt: Date.now(),
    });
    await writeAudit({ action: "PHOTO", module: input.ownerModule, recordId: input.ownerId, newValue: { photoId, kind: input.kind } });
  });
  return photoId;
}

export async function deletePhoto(id: string) {
  const db = getDb();
  const photo = await db.photos.get(id);
  if (!photo) return;
  await db.transaction("rw", db.photos, db.blobs, db.auditLogs, async () => {
    await db.photos.delete(id);
    await db.blobs.delete(photo.blobId);
    await writeAudit({ action: "DELETE", module: "photos", recordId: id, oldValue: photo });
  });
}

export async function createOvertime(data: Omit<Overtime, "id" | "totalMinutes" | "createdAt">) {
  const db = getDb();
  const c = ctx();
  const totalMinutes = computeOtMinutes({
    startTime: data.startTime,
    endTime: data.endTime,
    roundMinutes: c.otRound,
  });
  const row: Overtime = { ...data, id: nid(), totalMinutes, createdAt: Date.now() };
  await db.transaction("rw", db.overtimes, db.auditLogs, async () => {
    await db.overtimes.add(row);
    await writeAudit({ action: "OT_CREATE", module: "overtimes", recordId: row.id, newValue: row });
  });
  return row;
}

export async function updateOvertime(id: string, patch: Partial<Overtime>) {
  const db = getDb();
  const old = await db.overtimes.get(id);
  if (!old) throw new Error("Không tìm thấy OT");
  const c = ctx();
  const merged = { ...old, ...patch, id };
  merged.totalMinutes = computeOtMinutes({
    startTime: merged.startTime,
    endTime: merged.endTime,
    roundMinutes: c.otRound,
  });
  await db.overtimes.put(merged);
  await writeAudit({ action: "UPDATE", module: "overtimes", recordId: id, oldValue: old, newValue: merged });
  return merged;
}

export async function deleteOvertime(id: string) {
  const old = await getDb().overtimes.get(id);
  await getDb().overtimes.delete(id);
  await writeAudit({ action: "DELETE", module: "overtimes", recordId: id, oldValue: old });
}

export async function createAmh(data: Omit<Amh, "id" | "createdAt">) {
  const row: Amh = { ...data, id: nid(), createdAt: Date.now() };
  await getDb().amhs.add(row);
  await writeAudit({ action: "CREATE", module: "amhs", recordId: row.id, newValue: row });
  return row;
}

export async function updateAmh(id: string, patch: Partial<Amh>) {
  const old = await getDb().amhs.get(id);
  if (!old) throw new Error("Không tìm thấy AMH");
  const next = { ...old, ...patch, id };
  await getDb().amhs.put(next);
  await writeAudit({ action: "UPDATE", module: "amhs", recordId: id, oldValue: old, newValue: next });
  return next;
}

export async function deleteAmh(id: string) {
  const old = await getDb().amhs.get(id);
  await getDb().amhs.delete(id);
  await writeAudit({ action: "DELETE", module: "amhs", recordId: id, oldValue: old });
}

export async function upsertDataItem(data: Omit<DataItem, "id" | "createdAt" | "updatedAt" | "completedAt"> & { id?: string }) {
  const db = getDb();
  const now = Date.now();
  const completedAt = data.status === "COMPLETED" ? now : null;
  if (data.id) {
    const old = await db.dataItems.get(data.id);
    const next: DataItem = {
      ...(old as DataItem),
      ...data,
      id: data.id,
      updatedAt: now,
      completedAt: data.status === "COMPLETED" ? (old?.completedAt ?? now) : null,
    };
    await db.dataItems.put(next);
    await writeAudit({ action: "UPDATE", module: "dataItems", recordId: next.id, oldValue: old, newValue: next });
    return next;
  }
  const row: DataItem = { ...data, id: nid(), createdAt: now, updatedAt: now, completedAt };
  await db.dataItems.add(row);
  await writeAudit({ action: "CREATE", module: "dataItems", recordId: row.id, newValue: row });
  return row;
}

export async function deleteDataItem(id: string) {
  const old = await getDb().dataItems.get(id);
  await getDb().dataItems.delete(id);
  await writeAudit({ action: "DELETE", module: "dataItems", recordId: id, oldValue: old });
}

export async function upsertGoods(data: Omit<GoodsItem, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const db = getDb();
  const now = Date.now();
  if (data.id) {
    const old = await db.goodsItems.get(data.id);
    const next: GoodsItem = { ...(old as GoodsItem), ...data, id: data.id, updatedAt: now };
    await db.goodsItems.put(next);
    await writeAudit({ action: "UPDATE", module: "goodsItems", recordId: next.id, oldValue: old, newValue: next });
    return next;
  }
  const row: GoodsItem = { ...data, id: nid(), createdAt: now, updatedAt: now };
  await db.goodsItems.add(row);
  await writeAudit({ action: "CREATE", module: "goodsItems", recordId: row.id, newValue: row });
  return row;
}

export async function deleteGoods(id: string) {
  const old = await getDb().goodsItems.get(id);
  await getDb().goodsItems.delete(id);
  await writeAudit({ action: "DELETE", module: "goodsItems", recordId: id, oldValue: old });
}

export async function upsertLot(data: Omit<Lot, "id" | "createdAt"> & { id?: string }) {
  const db = getDb();
  if (data.id) {
    const old = await db.lots.get(data.id);
    if (old?.status === "CLOSED") throw new Error("Lot đã chốt, không sửa trực tiếp");
    const next: Lot = { ...(old as Lot), ...data, id: data.id };
    await db.lots.put(next);
    await writeAudit({ action: "UPDATE", module: "lots", recordId: next.id, oldValue: old, newValue: next });
    return next;
  }
  const row: Lot = { ...data, id: nid(), createdAt: Date.now() };
  await db.lots.add(row);
  await writeAudit({ action: "CREATE", module: "lots", recordId: row.id, newValue: row });
  return row;
}

export async function closeLot(lotId: string, note: string, photoId: string | null) {
  const db = getDb();
  const lot = await db.lots.get(lotId);
  if (!lot) throw new Error("Không tìm thấy Lot");
  if (lot.status === "CLOSED") throw new Error("Lot đã được chốt");
  const c = ctx();
  const now = Date.now();
  const closure = {
    id: nid(),
    lotId,
    closedBy: c.userId,
    closedAt: now,
    note,
    photoId,
  };
  await db.transaction("rw", db.lots, db.lotClosures, db.auditLogs, async () => {
    await db.lots.update(lotId, { status: "CLOSED" });
    await db.lotClosures.add(closure);
    await writeAudit({
      action: "LOT_CLOSE",
      module: "lots",
      recordId: lotId,
      oldValue: { status: lot.status },
      newValue: { status: "CLOSED", closedBy: c.userName, note },
    });
  });
  return closure;
}

export async function createThreeS(date: string, shiftId: string) {
  const row: ThreeSRecord = {
    id: nid(),
    date,
    shiftId,
    note: "",
    completedAt: null,
    createdAt: Date.now(),
  };
  const db = getDb();
  const labels = ["Sàng lọc", "Sắp xếp", "Sạch sẽ", "Săn sóc / Duy trì", "Sẵn sàng / Kỷ luật", "3D"];
  await db.transaction("rw", db.threeS, db.checklistItems, db.auditLogs, async () => {
    await db.threeS.add(row);
    await db.checklistItems.bulkAdd(
      labels.map((label, i) => ({
        id: nid(),
        checklistId: `threes-${row.id}`,
        taskId: null,
        threeSId: row.id,
        label,
        done: false,
        completedAt: null,
        completedBy: null,
        photoId: null,
        note: "",
        order: i + 1,
      })),
    );
    await writeAudit({ action: "CREATE", module: "threeS", recordId: row.id, newValue: row });
  });
  return row;
}

export async function createAbnormal(data: Omit<Abnormality, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const row: Abnormality = { ...data, id: nid(), createdAt: now, updatedAt: now };
  await getDb().abnormalities.add(row);
  await writeAudit({ action: "CREATE", module: "abnormalities", recordId: row.id, newValue: row });
  return row;
}

export async function updateAbnormal(id: string, patch: Partial<Abnormality>) {
  const old = await getDb().abnormalities.get(id);
  if (!old) throw new Error("Không tìm thấy bất thường");
  const next = { ...old, ...patch, id, updatedAt: Date.now() };
  await getDb().abnormalities.put(next);
  await writeAudit({ action: "UPDATE", module: "abnormalities", recordId: id, oldValue: old, newValue: next });
  return next;
}

export async function saveHandover(input: { summary: string; note: string }) {
  const c = ctx();
  const row: Handover = {
    id: nid(),
    date: c.date,
    shiftId: c.shiftId ?? "",
    createdBy: c.userId,
    summary: input.summary,
    note: input.note,
    createdAt: Date.now(),
  };
  await getDb().handovers.add(row);
  await writeAudit({ action: "HANDOVER", module: "handovers", recordId: row.id, newValue: row });
  return row;
}

export async function lookupCode(code: string) {
  const db = getDb();
  const q = code.trim();
  if (!q) return [] as Array<{ module: string; id: string; title: string; subtitle: string }>;
  const upper = q.toUpperCase();
  const hits: Array<{ module: string; id: string; title: string; subtitle: string }> = [];
  const employees = await db.employees.filter((e) => e.code.toUpperCase() === upper || e.name.toLowerCase().includes(q.toLowerCase())).toArray();
  for (const e of employees) hits.push({ module: "employees", id: e.id, title: e.name, subtitle: e.code });
  const data = await db.dataItems.filter((d) => d.productCode.toUpperCase() === upper || d.invoice.toUpperCase() === upper || d.lot.toUpperCase() === upper).toArray();
  for (const d of data) hits.push({ module: "dataItems", id: d.id, title: d.productCode, subtitle: `${d.invoice} · ${d.lot}` });
  const goods = await db.goodsItems.filter((d) => d.invoice.toUpperCase() === upper || d.productCode.toUpperCase() === upper || d.lot.toUpperCase() === upper || d.itemCode.toUpperCase() === upper).toArray();
  for (const d of goods) hits.push({ module: "goodsItems", id: d.id, title: d.itemCode || d.productCode, subtitle: d.invoice });
  const lots = await db.lots.filter((d) => d.lotCode.toUpperCase() === upper || d.invoice.toUpperCase() === upper).toArray();
  for (const d of lots) hits.push({ module: "lots", id: d.id, title: d.lotCode, subtitle: d.invoice });
  const tasks = await db.tasks.filter((t) => t.id === q || t.name.toLowerCase().includes(q.toLowerCase())).toArray();
  for (const t of tasks) hits.push({ module: "tasks", id: t.id, title: t.name, subtitle: t.id.slice(0, 8) });
  return hits;
}

export async function globalSearch(q: string) {
  return lookupCode(q);
}

export function todayIso() {
  return formatDate(new Date());
}
