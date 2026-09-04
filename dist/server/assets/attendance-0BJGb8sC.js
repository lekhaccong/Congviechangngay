import { c as formatTime, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { S as markAbsent, n as checkOut, t as checkIn } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { r as AttendanceBadge } from "./status-badge-DvBF2MJq.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/attendance.tsx?tsr-split=component
function AttendancePage() {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const role = useAppStore((s) => s.role);
	const people = useRows(() => getDb().employees.orderBy("code").toArray());
	const rows = useRows(() => getDb().attendance.filter((a) => a.date === date && (!shiftId || a.shiftId === shiftId)).toArray(), [date, shiftId]);
	const byEmp = new Map(rows.map((r) => [r.employeeId, r]));
	const onShift = people.filter((p) => !shiftId || p.shiftId === shiftId);
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(PageHeader, {
		title: "Chấm công",
		subtitle: "Giờ lấy từ đồng hồ điện thoại"
	}), /* @__PURE__ */ jsx("ul", {
		className: "divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
		children: onShift.map((p) => {
			const rec = byEmp.get(p.id);
			return /* @__PURE__ */ jsxs("li", {
				className: "px-4 py-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: p.name
					}), /* @__PURE__ */ jsxs("p", {
						className: "font-mono text-xs text-muted",
						children: [
							p.code,
							rec?.checkIn ? ` · vào ${formatTime(rec.checkIn)}` : "",
							rec?.checkOut ? ` · ra ${formatTime(rec.checkOut)}` : ""
						]
					})] }), rec ? /* @__PURE__ */ jsx(AttendanceBadge, { status: rec.status }) : /* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted",
						children: "Chưa chấm"
					})]
				}), can(role, "attendance") && p.status === "ACTIVE" ? /* @__PURE__ */ jsxs("div", {
					className: "mt-2 grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "secondary",
							disabled: Boolean(rec?.checkIn),
							onClick: async () => {
								try {
									await checkIn(p.id);
									toast.success(`Đã chấm vào: ${p.name}`);
								} catch (e) {
									toast.error(e instanceof Error ? e.message : "Lỗi");
								}
							},
							children: "Vào"
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "secondary",
							disabled: !rec?.checkIn || Boolean(rec?.checkOut),
							onClick: async () => {
								try {
									await checkOut(p.id);
									toast.success(`Đã chấm ra: ${p.name}`);
								} catch (e) {
									toast.error(e instanceof Error ? e.message : "Lỗi");
								}
							},
							children: "Ra"
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "outline",
							onClick: async () => {
								await markAbsent(p.id, "Nghỉ");
								toast.success("Đã ghi nghỉ");
							},
							children: "Nghỉ"
						})
					]
				}) : null]
			}, p.id);
		})
	})] });
}
//#endregion
export { AttendancePage as component };
