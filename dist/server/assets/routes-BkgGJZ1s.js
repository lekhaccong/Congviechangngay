import { h as getDb, s as formatHours, t as useAppStore } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { r as Stat } from "./page-header-BTcUZZCF.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertTriangle, ClipboardList, Clock, FileSpreadsheet, Package, ScanLine, Users } from "lucide-react";
//#region src/routes/index.tsx?tsr-split=component
function Dashboard() {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const employees = useRows(() => getDb().employees.toArray());
	const attendance = useRows(() => getDb().attendance.filter((a) => a.date === date && (!shiftId || a.shiftId === shiftId)).toArray(), [date, shiftId]);
	const tasks = useRows(() => getDb().tasks.filter((t) => t.date === date && (!shiftId || t.shiftId === shiftId)).toArray(), [date, shiftId]);
	const goods = useRows(() => getDb().goodsItems.filter((g) => g.exportDate === date).toArray(), [date]);
	const dataItems = useRows(() => getDb().dataItems.toArray());
	const lots = useRows(() => getDb().lots.filter((l) => l.date === date).toArray(), [date]);
	const ots = useRows(() => getDb().overtimes.filter((o) => o.date === date).toArray(), [date]);
	const abs = useRows(() => getDb().abnormalities.filter((a) => a.status === "NEW" || a.status === "PROCESSING").toArray());
	const onShift = employees.filter((e) => !shiftId || e.shiftId === shiftId);
	const present = attendance.filter((a) => a.checkIn && a.status !== "ABSENT").length;
	const missingPeople = Math.max(0, onShift.filter((e) => e.status === "ACTIVE").length - present);
	const taskDone = tasks.filter((t) => t.status === "COMPLETED").length;
	const taskOpen = tasks.filter((t) => t.status !== "COMPLETED").length;
	const goodsOk = goods.filter((g) => g.status === "COMPLETED" || g.status === "ENOUGH").length;
	const goodsOpen = goods.length - goodsOk;
	const dataOk = dataItems.filter((d) => d.status === "COMPLETED" || d.status === "ENOUGH" || d.status === "PUSHED").length;
	const dataMissing = dataItems.filter((d) => d.status === "MISSING" || d.status === "NEW" || d.status === "PROCESSING").length;
	const lotsClosed = lots.filter((l) => l.status === "CLOSED").length;
	const lotsOpen = lots.filter((l) => l.status !== "CLOSED").length;
	const otMin = ots.reduce((s, o) => s + o.totalMinutes, 0);
	const cards = [
		{
			to: "/people",
			icon: Users,
			title: "Nhân sự",
			value: `${present} / ${onShift.filter((e) => e.status === "ACTIVE").length}`,
			ok: `Có mặt: ${present}`,
			bad: `Thiếu: ${missingPeople}`,
			tone: missingPeople > 0 ? "warn" : "ok"
		},
		{
			to: "/tasks",
			icon: ClipboardList,
			title: "Công việc",
			value: String(tasks.length),
			ok: `Hoàn thành: ${taskDone}`,
			bad: `Đang làm: ${taskOpen}`,
			tone: taskOpen > 0 ? "info" : "ok"
		},
		{
			to: "/goods",
			icon: Package,
			title: "Hàng xuất",
			value: String(goods.length),
			ok: `OK: ${goodsOk}`,
			bad: `Chưa xong: ${goodsOpen}`,
			tone: goodsOpen > 0 ? "warn" : "ok"
		},
		{
			to: "/goods",
			icon: FileSpreadsheet,
			title: "DATA",
			value: String(dataItems.length),
			ok: `OK: ${dataOk}`,
			bad: `Thiếu/chưa xong: ${dataMissing}`,
			tone: dataMissing > 0 ? "danger" : "ok"
		},
		{
			to: "/goods",
			icon: ScanLine,
			title: "Lot",
			value: String(lots.length),
			ok: `Đã chốt: ${lotsClosed}`,
			bad: `Chưa chốt: ${lotsOpen}`,
			tone: lotsOpen > 0 ? "warn" : "ok"
		},
		{
			to: "/ot",
			icon: Clock,
			title: "OT",
			value: `${formatHours(otMin)} giờ`,
			ok: `${ots.length} phiếu`,
			bad: "",
			tone: "info"
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: "Ca hiện tại"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: "Nhìn nhanh tình trạng, bấm thẻ để vào module."
				})] }), /* @__PURE__ */ jsxs(Link, {
					to: "/unfinished",
					className: "inline-flex min-h-11 items-center rounded-full bg-danger/15 px-3 text-sm font-medium text-danger",
					children: [abs.length + taskOpen + lotsOpen + dataMissing, " cảnh báo"]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 gap-3",
				children: cards.map((c) => {
					const Icon = c.icon;
					return /* @__PURE__ */ jsxs(Link, {
						to: c.to,
						className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-3 flex items-center justify-between text-muted",
								children: [/* @__PURE__ */ jsx(Icon, { className: "size-5" }), /* @__PURE__ */ jsx("span", {
									className: "text-xs font-medium uppercase tracking-wide",
									children: c.title
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "font-mono text-2xl tabular-nums",
								children: c.value
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-xs text-ok",
								children: c.ok
							}),
							c.bad ? /* @__PURE__ */ jsx("p", {
								className: "text-xs text-warn",
								children: c.bad
							}) : null
						]
					}, c.title);
				})
			}),
			/* @__PURE__ */ jsxs(Link, {
				to: "/abnormal",
				className: "flex items-center justify-between rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "size-5 text-danger" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: "Cảnh báo"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Bất thường chưa đóng"
					})] })]
				}), /* @__PURE__ */ jsx("span", {
					className: "font-mono text-2xl tabular-nums text-danger",
					children: abs.length
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(Quick, {
						to: "/attendance",
						label: "Chấm công"
					}),
					/* @__PURE__ */ jsx(Quick, {
						to: "/shift-log",
						label: "Nhật ký ca"
					}),
					/* @__PURE__ */ jsx(Quick, {
						to: "/handover",
						label: "Bàn giao"
					}),
					/* @__PURE__ */ jsx(Quick, {
						to: "/backup",
						label: "Backup"
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-3 text-sm font-medium text-muted",
					children: "Tóm tắt số"
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-3 gap-3",
					children: [
						/* @__PURE__ */ jsx(Stat, {
							label: "Việc",
							value: tasks.length,
							hint: `${taskDone} xong`
						}),
						/* @__PURE__ */ jsx(Stat, {
							label: "OT giờ",
							value: formatHours(otMin)
						}),
						/* @__PURE__ */ jsx(Stat, {
							label: "Cảnh báo",
							value: abs.length,
							tone: abs.length ? "danger" : "ok"
						})
					]
				})]
			})
		]
	});
}
function Quick({ to, label }) {
	return /* @__PURE__ */ jsx(Link, {
		to,
		className: "flex min-h-14 items-center justify-center rounded-xl bg-surface-2 px-3 text-center text-sm font-medium shadow-[var(--shadow-border)]",
		children: label
	});
}
//#endregion
export { Dashboard as component };
