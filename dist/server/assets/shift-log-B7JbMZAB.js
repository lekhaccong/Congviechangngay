import { c as formatTime, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/shift-log.tsx?tsr-split=component
var ACTION_VI = {
	CREATE: "Tạo",
	UPDATE: "Cập nhật",
	DELETE: "Xóa",
	COMPLETE: "Hoàn thành",
	CHECK_IN: "Chấm vào",
	CHECK_OUT: "Chấm ra",
	OT_CREATE: "Khai OT",
	LOT_CLOSE: "Chốt Lot",
	BACKUP: "Backup",
	RESTORE: "Restore",
	IMPORT: "Import",
	EXPORT: "Export",
	PHOTO: "Chụp ảnh",
	PROGRESS: "Tiến độ",
	HANDOVER: "Bàn giao"
};
function ShiftLogPage() {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const ordered = [...useRows(() => getDb().auditLogs.filter((l) => l.date === date && (!shiftId || l.shiftId === shiftId || l.shiftId === null)).reverse().sortBy("timestamp"), [date, shiftId])].sort((a, b) => a.timestamp - b.timestamp);
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(PageHeader, {
		title: "Nhật ký ca",
		subtitle: "Timeline từ audit log — không sửa được lịch sử cũ"
	}), ordered.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
		title: "Chưa có thao tác trong ca",
		hint: "Chấm công, nhận việc, chốt lot sẽ hiện ở đây."
	}) : /* @__PURE__ */ jsx("ol", {
		className: "relative space-y-0 border-l border-border pl-4",
		children: ordered.map((l) => /* @__PURE__ */ jsxs("li", {
			className: "relative pb-5",
			children: [
				/* @__PURE__ */ jsx("span", { className: "absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" }),
				/* @__PURE__ */ jsx("p", {
					className: "font-mono text-xs tabular-nums text-muted",
					children: formatTime(l.timestamp)
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-medium",
							children: l.userName
						}),
						" ",
						ACTION_VI[l.action] ?? l.action,
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "text-muted",
							children: l.module
						})
					]
				})
			]
		}, l.id))
	})] });
}
//#endregion
export { ShiftLogPage as component };
