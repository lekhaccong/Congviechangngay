import { d as shiftWindow, h as getDb, r as durationMinutes, t as useAppStore, u as roundToStep } from "./store-Crr6urgA.js";
//#region src/lib/cvp/ids.ts
function nid() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
//#endregion
//#region src/lib/cvp/ot.ts
function computeOtMinutes(input) {
	const raw = durationMinutes(input.startTime, input.endTime);
	return roundToStep(raw, input.roundMinutes ?? 30);
}
function computeOtHours(input) {
	return Math.round(computeOtMinutes(input) / 60 * 10) / 10;
}
//#endregion
//#region src/lib/cvp/progress.ts
var PROGRESS_STEPS = [
	0,
	25,
	50,
	75,
	100
];
function clampProgress(value) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, Math.round(value)));
}
function statusFromProgress(progress, previous, deadline, now) {
	const p = clampProgress(progress);
	if (p >= 100) return "COMPLETED";
	if (deadline && now > deadline && p < 100) return "OVERDUE";
	if (p <= 0) {
		if (previous === "PAUSED") return "PAUSED";
		return previous === "IN_PROGRESS" || previous === "OVERDUE" ? "IN_PROGRESS" : "TODO";
	}
	if (previous === "PAUSED") return "PAUSED";
	return "IN_PROGRESS";
}
function applyProgress(task, progress, now) {
	const next = clampProgress(progress);
	const status = statusFromProgress(next, task.status, task.deadline, now);
	return {
		progress: next,
		status,
		completedAt: status === "COMPLETED" ? task.completedAt ?? now : null,
		updatedAt: now
	};
}
function refreshTaskStatus(task, now) {
	if (task.status === "COMPLETED" || task.progress >= 100) return "COMPLETED";
	if (task.status === "PAUSED") return "PAUSED";
	if (task.deadline && now > task.deadline && task.progress < 100) return "OVERDUE";
	return task.status;
}
//#endregion
//#region src/lib/cvp/repo.ts
function ctx() {
	const s = useAppStore.getState();
	return {
		userId: s.currentUserId ?? "system",
		userName: s.currentUserName || "Hệ thống",
		date: s.selectedDate,
		shiftId: s.selectedShiftId,
		otRound: s.otRoundMinutes
	};
}
async function writeAudit(input) {
	const db = getDb();
	const c = ctx();
	await db.auditLogs.add({
		id: nid(),
		userId: c.userId,
		userName: c.userName,
		action: input.action,
		module: input.module,
		recordId: input.recordId,
		oldValue: input.oldValue === void 0 ? null : JSON.stringify(input.oldValue),
		newValue: input.newValue === void 0 ? null : JSON.stringify(input.newValue),
		timestamp: Date.now(),
		date: c.date,
		shiftId: c.shiftId
	});
}
async function persistSetting(key, value) {
	await getDb().settings.put({
		key,
		value
	});
}
async function createEmployee(data) {
	const db = getDb();
	const now = Date.now();
	const row = {
		...data,
		id: nid(),
		createdAt: now,
		updatedAt: now
	};
	await db.transaction("rw", db.employees, db.auditLogs, async () => {
		await db.employees.add(row);
		await writeAudit({
			action: "CREATE",
			module: "employees",
			recordId: row.id,
			newValue: row
		});
	});
	return row;
}
async function updateEmployee(id, patch) {
	const db = getDb();
	const old = await db.employees.get(id);
	if (!old) throw new Error("Không tìm thấy nhân sự");
	const next = {
		...old,
		...patch,
		id,
		updatedAt: Date.now()
	};
	await db.transaction("rw", db.employees, db.auditLogs, async () => {
		await db.employees.put(next);
		await writeAudit({
			action: "UPDATE",
			module: "employees",
			recordId: id,
			oldValue: old,
			newValue: next
		});
	});
	return next;
}
async function deleteEmployee(id) {
	const db = getDb();
	const old = await db.employees.get(id);
	await db.transaction("rw", db.employees, db.auditLogs, async () => {
		await db.employees.delete(id);
		await writeAudit({
			action: "DELETE",
			module: "employees",
			recordId: id,
			oldValue: old
		});
	});
}
async function createGroup(name) {
	const db = getDb();
	const max = (await db.groups.toArray()).reduce((m, g) => Math.max(m, g.order), 0);
	const row = {
		id: nid(),
		name,
		order: max + 1
	};
	await db.groups.add(row);
	await writeAudit({
		action: "CREATE",
		module: "groups",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function renameGroup(id, name) {
	const db = getDb();
	const old = await db.groups.get(id);
	await db.groups.update(id, { name });
	await writeAudit({
		action: "UPDATE",
		module: "groups",
		recordId: id,
		oldValue: old,
		newValue: { name }
	});
}
async function deleteGroup(id) {
	const db = getDb();
	if (await db.employees.where("groupId").equals(id).count() > 0) throw new Error("Nhóm đang có nhân sự, không thể xóa");
	const old = await db.groups.get(id);
	await db.groups.delete(id);
	await writeAudit({
		action: "DELETE",
		module: "groups",
		recordId: id,
		oldValue: old
	});
}
async function createBlock(name) {
	const db = getDb();
	const max = (await db.workBlocks.toArray()).reduce((m, g) => Math.max(m, g.order), 0);
	const row = {
		id: nid(),
		name,
		order: max + 1
	};
	await db.workBlocks.add(row);
	await writeAudit({
		action: "CREATE",
		module: "workBlocks",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function updateBlock(id, name) {
	await getDb().workBlocks.update(id, { name });
	await writeAudit({
		action: "UPDATE",
		module: "workBlocks",
		recordId: id,
		newValue: { name }
	});
}
async function deleteBlock(id) {
	const db = getDb();
	if (await db.tasks.where("blockId").equals(id).count() > 0) throw new Error("Khối đang có công việc, không thể xóa");
	await db.workBlocks.delete(id);
	await writeAudit({
		action: "DELETE",
		module: "workBlocks",
		recordId: id
	});
}
async function reorderBlocks(ids) {
	const db = getDb();
	await db.transaction("rw", db.workBlocks, async () => {
		for (let i = 0; i < ids.length; i++) await db.workBlocks.update(ids[i], { order: i + 1 });
	});
}
async function checkIn(employeeId) {
	const db = getDb();
	const c = ctx();
	const now = Date.now();
	const shiftId = c.shiftId;
	if (!shiftId) throw new Error("Chưa chọn ca");
	const shift = await db.shifts.get(shiftId);
	if (!shift) throw new Error("Không tìm thấy ca");
	const existing = await db.attendance.where("[employeeId+date+shiftId]").equals([
		employeeId,
		c.date,
		shiftId
	]).first();
	if (existing?.checkIn) throw new Error("Đã chấm vào ca này");
	const status = now > shiftWindow(c.date, shift).start.getTime() + 3e5 ? "LATE" : "CHECKED_IN";
	const row = existing ? {
		...existing,
		checkIn: now,
		status,
		createdAt: existing.createdAt
	} : {
		id: nid(),
		employeeId,
		date: c.date,
		shiftId,
		checkIn: now,
		checkOut: null,
		status,
		otMinutes: 0,
		note: "",
		createdAt: now
	};
	await db.transaction("rw", db.attendance, db.auditLogs, async () => {
		await db.attendance.put(row);
		await writeAudit({
			action: "CHECK_IN",
			module: "attendance",
			recordId: row.id,
			newValue: row
		});
	});
	return row;
}
async function checkOut(employeeId) {
	const db = getDb();
	const c = ctx();
	const now = Date.now();
	const shiftId = c.shiftId;
	if (!shiftId) throw new Error("Chưa chọn ca");
	const shift = await db.shifts.get(shiftId);
	if (!shift) throw new Error("Không tìm thấy ca");
	const existing = await db.attendance.where("[employeeId+date+shiftId]").equals([
		employeeId,
		c.date,
		shiftId
	]).first();
	if (!existing?.checkIn) throw new Error("Chưa chấm vào");
	if (existing.checkOut) throw new Error("Đã chấm ra");
	const window = shiftWindow(c.date, shift);
	const grace = 3e5;
	let status = existing.status === "LATE" ? "LATE" : "PRESENT";
	let otMinutes = 0;
	if (now < window.end.getTime() - grace) status = "EARLY_LEAVE";
	if (now > window.end.getTime() + grace) {
		status = "OVERTIME";
		otMinutes = Math.round((now - window.end.getTime()) / 6e4);
	}
	const next = {
		...existing,
		checkOut: now,
		status,
		otMinutes
	};
	await db.transaction("rw", db.attendance, db.auditLogs, async () => {
		await db.attendance.put(next);
		await writeAudit({
			action: "CHECK_OUT",
			module: "attendance",
			recordId: next.id,
			newValue: next
		});
	});
	return next;
}
async function markAbsent(employeeId, note) {
	const db = getDb();
	const c = ctx();
	const shiftId = c.shiftId;
	if (!shiftId) throw new Error("Chưa chọn ca");
	const existing = await db.attendance.where("[employeeId+date+shiftId]").equals([
		employeeId,
		c.date,
		shiftId
	]).first();
	const row = existing ? {
		...existing,
		status: "ABSENT",
		note
	} : {
		id: nid(),
		employeeId,
		date: c.date,
		shiftId,
		checkIn: null,
		checkOut: null,
		status: "ABSENT",
		otMinutes: 0,
		note,
		createdAt: Date.now()
	};
	await db.attendance.put(row);
	await writeAudit({
		action: "UPDATE",
		module: "attendance",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function createTask(data) {
	const now = Date.now();
	const row = {
		...data,
		id: nid(),
		progress: data.progress ?? 0,
		status: "TODO",
		createdAt: now,
		updatedAt: now,
		completedAt: null
	};
	const db = getDb();
	await db.transaction("rw", db.tasks, db.auditLogs, async () => {
		await db.tasks.add(row);
		await writeAudit({
			action: "CREATE",
			module: "tasks",
			recordId: row.id,
			newValue: row
		});
	});
	return row;
}
async function updateTask(id, patch) {
	const db = getDb();
	const old = await db.tasks.get(id);
	if (!old) throw new Error("Không tìm thấy công việc");
	const next = {
		...old,
		...patch,
		id,
		updatedAt: Date.now()
	};
	await db.tasks.put(next);
	await writeAudit({
		action: "UPDATE",
		module: "tasks",
		recordId: id,
		oldValue: old,
		newValue: next
	});
	return next;
}
async function setTaskProgress(id, progress) {
	const db = getDb();
	const old = await db.tasks.get(id);
	if (!old) throw new Error("Không tìm thấy công việc");
	const applied = applyProgress(old, progress, Date.now());
	const next = {
		...old,
		...applied
	};
	await db.transaction("rw", db.tasks, db.auditLogs, async () => {
		await db.tasks.put(next);
		await writeAudit({
			action: applied.status === "COMPLETED" ? "COMPLETE" : "PROGRESS",
			module: "tasks",
			recordId: id,
			oldValue: {
				progress: old.progress,
				status: old.status
			},
			newValue: {
				progress: next.progress,
				status: next.status
			}
		});
	});
	return next;
}
async function deleteTask(id) {
	const db = getDb();
	const old = await db.tasks.get(id);
	await db.transaction("rw", db.tasks, db.auditLogs, async () => {
		await db.tasks.delete(id);
		await writeAudit({
			action: "DELETE",
			module: "tasks",
			recordId: id,
			oldValue: old
		});
	});
}
async function refreshOverdueTasks() {
	const db = getDb();
	const now = Date.now();
	const open = await db.tasks.filter((t) => t.status !== "COMPLETED").toArray();
	for (const t of open) {
		const next = refreshTaskStatus(t, now);
		if (next !== t.status) await db.tasks.update(t.id, {
			status: next,
			updatedAt: now
		});
	}
}
async function toggleChecklistItem(id, done) {
	const db = getDb();
	const c = ctx();
	const now = Date.now();
	await db.checklistItems.update(id, {
		done,
		completedAt: done ? now : null,
		completedBy: done ? c.userId : null
	});
	await writeAudit({
		action: done ? "COMPLETE" : "UPDATE",
		module: "checklistItems",
		recordId: id,
		newValue: { done }
	});
}
async function savePhoto(input) {
	const db = getDb();
	const blobId = nid();
	const photoId = nid();
	await db.transaction("rw", db.blobs, db.photos, db.auditLogs, async () => {
		await db.blobs.add({
			id: blobId,
			mime: input.blob.type || "image/jpeg",
			data: input.blob,
			createdAt: Date.now()
		});
		await db.photos.add({
			id: photoId,
			ownerModule: input.ownerModule,
			ownerId: input.ownerId,
			kind: input.kind,
			blobId,
			note: input.note ?? "",
			createdAt: Date.now()
		});
		await writeAudit({
			action: "PHOTO",
			module: input.ownerModule,
			recordId: input.ownerId,
			newValue: {
				photoId,
				kind: input.kind
			}
		});
	});
	return photoId;
}
async function deletePhoto(id) {
	const db = getDb();
	const photo = await db.photos.get(id);
	if (!photo) return;
	await db.transaction("rw", db.photos, db.blobs, async () => {
		await db.photos.delete(id);
		await db.blobs.delete(photo.blobId);
	});
}
async function createOvertime(data) {
	const db = getDb();
	const c = ctx();
	const totalMinutes = computeOtMinutes({
		startTime: data.startTime,
		endTime: data.endTime,
		roundMinutes: c.otRound
	});
	const row = {
		...data,
		id: nid(),
		totalMinutes,
		createdAt: Date.now()
	};
	await db.transaction("rw", db.overtimes, db.auditLogs, async () => {
		await db.overtimes.add(row);
		await writeAudit({
			action: "OT_CREATE",
			module: "overtimes",
			recordId: row.id,
			newValue: row
		});
	});
	return row;
}
async function deleteOvertime(id) {
	const old = await getDb().overtimes.get(id);
	await getDb().overtimes.delete(id);
	await writeAudit({
		action: "DELETE",
		module: "overtimes",
		recordId: id,
		oldValue: old
	});
}
async function createAmh(data) {
	const row = {
		...data,
		id: nid(),
		createdAt: Date.now()
	};
	await getDb().amhs.add(row);
	await writeAudit({
		action: "CREATE",
		module: "amhs",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function updateAmh(id, patch) {
	const old = await getDb().amhs.get(id);
	if (!old) throw new Error("Không tìm thấy AMH");
	const next = {
		...old,
		...patch,
		id
	};
	await getDb().amhs.put(next);
	await writeAudit({
		action: "UPDATE",
		module: "amhs",
		recordId: id,
		oldValue: old,
		newValue: next
	});
	return next;
}
async function deleteAmh(id) {
	const old = await getDb().amhs.get(id);
	await getDb().amhs.delete(id);
	await writeAudit({
		action: "DELETE",
		module: "amhs",
		recordId: id,
		oldValue: old
	});
}
async function upsertDataItem(data) {
	const db = getDb();
	const now = Date.now();
	const completedAt = data.status === "COMPLETED" ? now : null;
	if (data.id) {
		const old = await db.dataItems.get(data.id);
		const next = {
			...old,
			...data,
			id: data.id,
			updatedAt: now,
			completedAt: data.status === "COMPLETED" ? old?.completedAt ?? now : null
		};
		await db.dataItems.put(next);
		await writeAudit({
			action: "UPDATE",
			module: "dataItems",
			recordId: next.id,
			oldValue: old,
			newValue: next
		});
		return next;
	}
	const row = {
		...data,
		id: nid(),
		createdAt: now,
		updatedAt: now,
		completedAt
	};
	await db.dataItems.add(row);
	await writeAudit({
		action: "CREATE",
		module: "dataItems",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function deleteDataItem(id) {
	const old = await getDb().dataItems.get(id);
	await getDb().dataItems.delete(id);
	await writeAudit({
		action: "DELETE",
		module: "dataItems",
		recordId: id,
		oldValue: old
	});
}
async function upsertGoods(data) {
	const db = getDb();
	const now = Date.now();
	if (data.id) {
		const old = await db.goodsItems.get(data.id);
		const next = {
			...old,
			...data,
			id: data.id,
			updatedAt: now
		};
		await db.goodsItems.put(next);
		await writeAudit({
			action: "UPDATE",
			module: "goodsItems",
			recordId: next.id,
			oldValue: old,
			newValue: next
		});
		return next;
	}
	const row = {
		...data,
		id: nid(),
		createdAt: now,
		updatedAt: now
	};
	await db.goodsItems.add(row);
	await writeAudit({
		action: "CREATE",
		module: "goodsItems",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function deleteGoods(id) {
	const old = await getDb().goodsItems.get(id);
	await getDb().goodsItems.delete(id);
	await writeAudit({
		action: "DELETE",
		module: "goodsItems",
		recordId: id,
		oldValue: old
	});
}
async function upsertLot(data) {
	const db = getDb();
	if (data.id) {
		const old = await db.lots.get(data.id);
		if (old?.status === "CLOSED") throw new Error("Lot đã chốt, không sửa trực tiếp");
		const next = {
			...old,
			...data,
			id: data.id
		};
		await db.lots.put(next);
		await writeAudit({
			action: "UPDATE",
			module: "lots",
			recordId: next.id,
			oldValue: old,
			newValue: next
		});
		return next;
	}
	const row = {
		...data,
		id: nid(),
		createdAt: Date.now()
	};
	await db.lots.add(row);
	await writeAudit({
		action: "CREATE",
		module: "lots",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function closeLot(lotId, note, photoId) {
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
		photoId
	};
	await db.transaction("rw", db.lots, db.lotClosures, db.auditLogs, async () => {
		await db.lots.update(lotId, { status: "CLOSED" });
		await db.lotClosures.add(closure);
		await writeAudit({
			action: "LOT_CLOSE",
			module: "lots",
			recordId: lotId,
			oldValue: { status: lot.status },
			newValue: {
				status: "CLOSED",
				closedBy: c.userName,
				note
			}
		});
	});
	return closure;
}
async function createThreeS(date, shiftId) {
	const row = {
		id: nid(),
		date,
		shiftId,
		note: "",
		completedAt: null,
		createdAt: Date.now()
	};
	const db = getDb();
	const labels = [
		"Sàng lọc",
		"Sắp xếp",
		"Sạch sẽ",
		"Săn sóc / Duy trì",
		"Sẵn sàng / Kỷ luật",
		"3D"
	];
	await db.transaction("rw", db.threeS, db.checklistItems, db.auditLogs, async () => {
		await db.threeS.add(row);
		await db.checklistItems.bulkAdd(labels.map((label, i) => ({
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
			order: i + 1
		})));
		await writeAudit({
			action: "CREATE",
			module: "threeS",
			recordId: row.id,
			newValue: row
		});
	});
	return row;
}
async function createAbnormal(data) {
	const now = Date.now();
	const row = {
		...data,
		id: nid(),
		createdAt: now,
		updatedAt: now
	};
	await getDb().abnormalities.add(row);
	await writeAudit({
		action: "CREATE",
		module: "abnormalities",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function updateAbnormal(id, patch) {
	const old = await getDb().abnormalities.get(id);
	if (!old) throw new Error("Không tìm thấy bất thường");
	const next = {
		...old,
		...patch,
		id,
		updatedAt: Date.now()
	};
	await getDb().abnormalities.put(next);
	await writeAudit({
		action: "UPDATE",
		module: "abnormalities",
		recordId: id,
		oldValue: old,
		newValue: next
	});
	return next;
}
async function saveHandover(input) {
	const c = ctx();
	const row = {
		id: nid(),
		date: c.date,
		shiftId: c.shiftId ?? "",
		createdBy: c.userId,
		summary: input.summary,
		note: input.note,
		createdAt: Date.now()
	};
	await getDb().handovers.add(row);
	await writeAudit({
		action: "HANDOVER",
		module: "handovers",
		recordId: row.id,
		newValue: row
	});
	return row;
}
async function lookupCode(code) {
	const db = getDb();
	const q = code.trim();
	if (!q) return [];
	const upper = q.toUpperCase();
	const hits = [];
	const employees = await db.employees.filter((e) => e.code.toUpperCase() === upper || e.name.toLowerCase().includes(q.toLowerCase())).toArray();
	for (const e of employees) hits.push({
		module: "employees",
		id: e.id,
		title: e.name,
		subtitle: e.code
	});
	const data = await db.dataItems.filter((d) => d.productCode.toUpperCase() === upper || d.invoice.toUpperCase() === upper || d.lot.toUpperCase() === upper).toArray();
	for (const d of data) hits.push({
		module: "dataItems",
		id: d.id,
		title: d.productCode,
		subtitle: `${d.invoice} · ${d.lot}`
	});
	const goods = await db.goodsItems.filter((d) => d.invoice.toUpperCase() === upper || d.productCode.toUpperCase() === upper || d.lot.toUpperCase() === upper || d.itemCode.toUpperCase() === upper).toArray();
	for (const d of goods) hits.push({
		module: "goodsItems",
		id: d.id,
		title: d.itemCode || d.productCode,
		subtitle: d.invoice
	});
	const lots = await db.lots.filter((d) => d.lotCode.toUpperCase() === upper || d.invoice.toUpperCase() === upper).toArray();
	for (const d of lots) hits.push({
		module: "lots",
		id: d.id,
		title: d.lotCode,
		subtitle: d.invoice
	});
	const tasks = await db.tasks.filter((t) => t.id === q || t.name.toLowerCase().includes(q.toLowerCase())).toArray();
	for (const t of tasks) hits.push({
		module: "tasks",
		id: t.id,
		title: t.name,
		subtitle: t.id.slice(0, 8)
	});
	return hits;
}
//#endregion
export { toggleChecklistItem as A, PROGRESS_STEPS as B, persistSetting as C, saveHandover as D, reorderBlocks as E, updateTask as F, nid as H, upsertDataItem as I, upsertGoods as L, updateAmh as M, updateBlock as N, savePhoto as O, updateEmployee as P, upsertLot as R, markAbsent as S, renameGroup as T, computeOtHours as V, deleteGroup as _, createAmh as a, deleteTask as b, createGroup as c, createThreeS as d, deleteAmh as f, deleteGoods as g, deleteEmployee as h, createAbnormal as i, updateAbnormal as j, setTaskProgress as k, createOvertime as l, deleteDataItem as m, checkOut as n, createBlock as o, deleteBlock as p, closeLot as r, createEmployee as s, checkIn as t, createTask as u, deleteOvertime as v, refreshOverdueTasks as w, lookupCode as x, deletePhoto as y, writeAudit as z };
