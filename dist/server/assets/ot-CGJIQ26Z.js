import { h as getDb, s as formatHours, t as useAppStore } from "./store-Crr6urgA.js";
import { M as updateAmh, V as computeOtHours, a as createAmh, f as deleteAmh, l as createOvertime, v as deleteOvertime } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { i as Textarea, n as Input, r as NativeSelect, t as Field } from "./input-D0c9ilIZ.js";
import { d as OT_TYPES } from "./types-hR0syAmZ.js";
import { n as PageHeader, r as Stat } from "./page-header-BTcUZZCF.js";
import { n as AmhBadge } from "./status-badge-DvBF2MJq.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/ot.tsx?tsr-split=component
function OtPage() {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const role = useAppStore((s) => s.role);
	const round = useAppStore((s) => s.otRoundMinutes);
	const people = useRows(() => getDb().employees.toArray());
	const ots = useRows(() => getDb().overtimes.toArray());
	const amhs = useRows(() => getDb().amhs.toArray());
	const [tab, setTab] = useState("ot");
	const [open, setOpen] = useState(false);
	const todayOt = ots.filter((o) => o.date === date);
	const totalMin = ots.reduce((s, o) => s + o.totalMinutes, 0);
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "OT / AMH",
			subtitle: `Làm tròn ${round} phút · qua 00:00 tính đúng`,
			action: can(role, "manage_ot") ? /* @__PURE__ */ jsx(Button, {
				size: "sm",
				onClick: () => setOpen(true),
				children: "Khai báo"
			}) : null
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mb-4 grid grid-cols-3 gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ jsx(Stat, {
					label: "Hôm nay",
					value: `${formatHours(todayOt.reduce((s, o) => s + o.totalMinutes, 0))}h`
				}),
				/* @__PURE__ */ jsx(Stat, {
					label: "Tổng",
					value: `${formatHours(totalMin)}h`
				}),
				/* @__PURE__ */ jsx(Stat, {
					label: "Phiếu AMH",
					value: amhs.length
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ jsx(Button, {
				variant: tab === "ot" ? "default" : "secondary",
				onClick: () => setTab("ot"),
				children: "OT"
			}), /* @__PURE__ */ jsx(Button, {
				variant: tab === "amh" ? "default" : "secondary",
				onClick: () => setTab("amh"),
				children: "AMH"
			})]
		}),
		tab === "ot" ? /* @__PURE__ */ jsxs("ul", {
			className: "divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
			children: [ots.map((o) => {
				const who = people.find((p) => p.id === o.employeeId);
				return /* @__PURE__ */ jsxs("li", {
					className: "flex items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: who?.name ?? "—"
					}), /* @__PURE__ */ jsxs("p", {
						className: "font-mono text-xs text-muted",
						children: [
							o.date,
							" · ",
							o.startTime,
							"–",
							o.endTime,
							" · ",
							o.type
						]
					})] }), /* @__PURE__ */ jsxs("div", {
						className: "text-right",
						children: [/* @__PURE__ */ jsxs("p", {
							className: "font-mono tabular-nums",
							children: [formatHours(o.totalMinutes), "h"]
						}), can(role, "manage_ot") ? /* @__PURE__ */ jsx("button", {
							className: "text-xs text-danger",
							onClick: () => void deleteOvertime(o.id),
							children: "Xóa"
						}) : null]
					})]
				}, o.id);
			}), ots.length === 0 ? /* @__PURE__ */ jsx("li", {
				className: "px-4 py-6 text-sm text-muted",
				children: "Chưa có OT"
			}) : null]
		}) : /* @__PURE__ */ jsxs("ul", {
			className: "divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
			children: [amhs.map((a) => {
				const who = people.find((p) => p.id === a.employeeId);
				return /* @__PURE__ */ jsxs("li", {
					className: "px-4 py-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: who?.name ?? "—"
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-xs text-muted",
							children: [
								a.date,
								" · ",
								a.hours,
								"h · ",
								a.note
							]
						})] }), /* @__PURE__ */ jsx(AmhBadge, { status: a.status })]
					}), can(role, "manage_ot") ? /* @__PURE__ */ jsxs("div", {
						className: "mt-2 flex gap-2",
						children: [[
							"APPROVED",
							"REJECTED",
							"DONE"
						].map((st) => /* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => void updateAmh(a.id, { status: st }),
							children: st === "APPROVED" ? "Duyệt" : st === "REJECTED" ? "Từ chối" : "Xong"
						}, st)), /* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "danger",
							onClick: () => void deleteAmh(a.id),
							children: "Xóa"
						})]
					}) : null]
				}, a.id);
			}), amhs.length === 0 ? /* @__PURE__ */ jsx("li", {
				className: "px-4 py-6 text-sm text-muted",
				children: "Chưa có AMH"
			}) : null]
		}),
		/* @__PURE__ */ jsx(DeclareDialog, {
			open,
			onClose: () => setOpen(false),
			people,
			date,
			shiftId: shiftId ?? "",
			round,
			tab
		})
	] });
}
function DeclareDialog({ open, onClose, people, date, shiftId, round, tab }) {
	const [employeeId, setEmp] = useState(people[0]?.id ?? "");
	const [startTime, setStart] = useState("14:00");
	const [endTime, setEnd] = useState("16:00");
	const [type, setType] = useState(OT_TYPES[0]);
	const [note, setNote] = useState("");
	const hours = computeOtHours({
		startTime,
		endTime,
		roundMinutes: round
	});
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onClose,
		title: tab === "ot" ? "Khai OT" : "Khai AMH",
		children: /* @__PURE__ */ jsxs("form", {
			className: "space-y-3",
			onSubmit: async (e) => {
				e.preventDefault();
				if (tab === "ot") {
					await createOvertime({
						employeeId,
						date,
						shiftId,
						startTime,
						endTime,
						type,
						note
					});
					toast.success(`Đã lưu OT ${hours} giờ`);
				} else {
					await createAmh({
						employeeId,
						date,
						shiftId,
						hours,
						status: "DECLARED",
						note,
						taskId: null
					});
					toast.success("Đã lưu AMH");
				}
				onClose();
			},
			children: [
				/* @__PURE__ */ jsx(Field, {
					label: "Nhân sự",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: employeeId,
						onChange: (e) => setEmp(e.target.value),
						children: people.map((p) => /* @__PURE__ */ jsx("option", {
							value: p.id,
							children: p.name
						}, p.id))
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ jsx(Field, {
						label: "Bắt đầu",
						children: /* @__PURE__ */ jsx(Input, {
							type: "time",
							value: startTime,
							onChange: (e) => setStart(e.target.value)
						})
					}), /* @__PURE__ */ jsx(Field, {
						label: "Kết thúc",
						children: /* @__PURE__ */ jsx(Input, {
							type: "time",
							value: endTime,
							onChange: (e) => setEnd(e.target.value)
						})
					})]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted",
					children: [
						"Tự tính: ",
						/* @__PURE__ */ jsxs("span", {
							className: "font-mono tabular-nums text-fg",
							children: [hours, " giờ"]
						}),
						" (qua nửa đêm vẫn đúng)"
					]
				}),
				tab === "ot" ? /* @__PURE__ */ jsx(Field, {
					label: "Loại",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: type,
						onChange: (e) => setType(e.target.value),
						children: OT_TYPES.map((t) => /* @__PURE__ */ jsx("option", { children: t }, t))
					})
				}) : null,
				/* @__PURE__ */ jsx(Field, {
					label: "Ghi chú",
					children: /* @__PURE__ */ jsx(Textarea, {
						value: note,
						onChange: (e) => setNote(e.target.value)
					})
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "submit",
					className: "w-full",
					children: "Lưu"
				})
			]
		})
	});
}
//#endregion
export { OtPage as component };
