import Dexie from "dexie";
import { create } from "zustand";
//#region src/lib/cvp/db.ts
var CvpDB = class extends Dexie {
	employees;
	groups;
	shifts;
	attendance;
	workBlocks;
	tasks;
	checklists;
	checklistItems;
	photos;
	blobs;
	auditLogs;
	overtimes;
	amhs;
	dataItems;
	goodsItems;
	lots;
	lotClosures;
	threeS;
	abnormalities;
	notifications;
	settings;
	handovers;
	constructor() {
		super("congviecpro");
		this.version(1).stores({
			employees: "id, code, groupId, shiftId, status, name",
			groups: "id, order",
			shifts: "id, order",
			attendance: "id, employeeId, date, shiftId, [employeeId+date+shiftId]",
			workBlocks: "id, order",
			tasks: "id, blockId, assigneeId, date, shiftId, status, deadline",
			checklists: "id, blockId",
			checklistItems: "id, checklistId, taskId, threeSId, done",
			photos: "id, ownerModule, ownerId, createdAt",
			blobs: "id",
			auditLogs: "id, timestamp, module, recordId, date, shiftId, action",
			overtimes: "id, employeeId, date, shiftId",
			amhs: "id, employeeId, date, shiftId, status",
			dataItems: "id, productCode, invoice, lot, status",
			goodsItems: "id, invoice, productCode, lot, status, exportDate",
			lots: "id, lotCode, invoice, productCode, status, date",
			lotClosures: "id, lotId, closedAt",
			threeS: "id, date, shiftId",
			abnormalities: "id, status, detectedAt, linkedModule, linkedId",
			notifications: "id, dueAt, read",
			settings: "key",
			handovers: "id, date, shiftId"
		});
	}
};
var _db = null;
function canUseDb() {
	return typeof indexedDB !== "undefined";
}
function getDb() {
	if (!canUseDb()) throw new Error("IndexedDB không khả dụng");
	if (!_db) _db = new CvpDB();
	return _db;
}
async function resetDatabase() {
	await getDb().delete();
	_db = null;
}
//#endregion
//#region src/lib/cvp/time.ts
function pad2(n) {
	return n.toString().padStart(2, "0");
}
function parseHHmm(value) {
	const [h, m] = value.split(":").map((x) => Number(x));
	if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
	return h * 60 + m;
}
function formatDate(d) {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseDate(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}
function addDays(iso, days) {
	const d = parseDate(iso);
	d.setDate(d.getDate() + days);
	return formatDate(d);
}
function formatDateVi(iso) {
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}
function formatTime(ts) {
	const d = new Date(ts);
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatDateTime(ts) {
	const d = new Date(ts);
	return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function combineDateTime(date, hhmm) {
	const [h, m] = hhmm.split(":").map(Number);
	const d = parseDate(date);
	d.setHours(h ?? 0, m ?? 0, 0, 0);
	return d;
}
/** Ca 4 22:00–06:00: if now is 01:00 on 02/09, the shift date is 01/09. */
function shiftDateFor(now, shift) {
	const today = formatDate(now);
	if (!shift.crossesMidnight) return today;
	const mins = now.getHours() * 60 + now.getMinutes();
	const endMins = parseHHmm(shift.endTime);
	const startMins = parseHHmm(shift.startTime);
	if (mins < endMins && endMins < startMins) return addDays(today, -1);
	return today;
}
function shiftWindow(date, shift) {
	const start = combineDateTime(date, shift.startTime);
	let end = combineDateTime(date, shift.endTime);
	if (shift.crossesMidnight || end.getTime() <= start.getTime()) end = combineDateTime(addDays(date, 1), shift.endTime);
	return {
		start,
		end,
		date,
		shift
	};
}
function isInWindow(now, window) {
	const t = now.getTime();
	return t >= window.start.getTime() && t < window.end.getTime();
}
/**
* Pick the active shift. Overlapping windows (Ca 1 06–14 and Ca 2 08–17)
* resolve to the shift that started most recently.
*/
function getActiveShift(now, shifts) {
	const today = formatDate(now);
	const yesterday = addDays(today, -1);
	const candidates = [];
	for (const shift of shifts) {
		const dates = shift.crossesMidnight ? [yesterday, today] : [today];
		for (const date of dates) {
			const w = shiftWindow(date, shift);
			if (isInWindow(now, w)) candidates.push({
				shift,
				start: w.start.getTime()
			});
		}
	}
	if (candidates.length === 0) return null;
	candidates.sort((a, b) => b.start - a.start);
	return candidates[0]?.shift ?? null;
}
function getActiveContext(now, shifts) {
	const shift = getActiveShift(now, shifts);
	if (!shift) return null;
	return {
		shift,
		date: shiftDateFor(now, shift)
	};
}
function durationMinutes(startHHmm, endHHmm) {
	const s = parseHHmm(startHHmm);
	let d = parseHHmm(endHHmm) - s;
	if (d <= 0) d += 1440;
	return d;
}
function roundToStep(minutes, step) {
	if (step <= 0) return minutes;
	return Math.round(minutes / step) * step;
}
function hoursFromMinutes(minutes) {
	return Math.round(minutes / 60 * 10) / 10;
}
function formatHours(minutes) {
	const h = hoursFromMinutes(minutes);
	return Number.isInteger(h) ? `${h}` : h.toFixed(1);
}
function startOfWeek(iso) {
	const d = parseDate(iso);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	return formatDate(d);
}
function startOfMonth(iso) {
	const d = parseDate(iso);
	d.setDate(1);
	return formatDate(d);
}
//#endregion
//#region src/lib/cvp/store.ts
var useAppStore = create((set) => ({
	ready: false,
	currentUserId: null,
	currentUserName: "Hệ thống",
	role: "ADMIN",
	selectedDate: formatDate(/* @__PURE__ */ new Date()),
	selectedShiftId: null,
	autoShift: true,
	otRoundMinutes: 30,
	sampleData: false,
	setReady: (ready) => set({ ready }),
	hydrate: (partial) => set(partial),
	setUser: (currentUserId, currentUserName, role) => set({
		currentUserId,
		currentUserName,
		role
	}),
	setDate: (selectedDate) => set({ selectedDate }),
	setShift: (selectedShiftId, autoShift) => set({
		selectedShiftId,
		autoShift
	}),
	setOtRound: (otRoundMinutes) => set({ otRoundMinutes }),
	setSampleData: (sampleData) => set({ sampleData })
}));
//#endregion
export { formatDateTime as a, formatTime as c, shiftWindow as d, startOfMonth as f, resetDatabase as g, getDb as h, formatDate as i, getActiveContext as l, canUseDb as m, addDays as n, formatDateVi as o, startOfWeek as p, durationMinutes as r, formatHours as s, useAppStore as t, roundToStep as u };
