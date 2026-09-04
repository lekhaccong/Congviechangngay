import { a as formatDateTime, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { P as updateEmployee, h as deleteEmployee } from "./repo-CgXr20UM.js";
import { n as useRows, t as useRow } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { p as ROLE_LABEL } from "./types-hR0syAmZ.js";
import { o as Route } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { a as EmployeeBadge } from "./status-badge-DvBF2MJq.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { t as PersonForm } from "./person-form-ugKqjdik.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/people.$id.tsx?tsr-split=component
function PersonDetail() {
	const { id } = Route.useParams();
	const nav = useNavigate();
	const role = useAppStore((s) => s.role);
	const person = useRow(() => getDb().employees.get(id), [id]);
	const groups = useRows(() => getDb().groups.toArray());
	const shifts = useRows(() => getDb().shifts.toArray());
	const attendance = useRows(() => getDb().attendance.where("employeeId").equals(id).reverse().sortBy("createdAt"), [id]);
	const ots = useRows(() => getDb().overtimes.where("employeeId").equals(id).toArray(), [id]);
	const [edit, setEdit] = useState(false);
	if (!person) return /* @__PURE__ */ jsx("p", {
		className: "text-muted",
		children: "Không tìm thấy nhân sự."
	});
	const g = groups.find((x) => x.id === person.groupId);
	const s = shifts.find((x) => x.id === person.shiftId);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: person.name,
				subtitle: person.code,
				back: "/people",
				action: can(role, "manage_people") ? /* @__PURE__ */ jsx(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => setEdit(true),
					children: "Sửa"
				}) : null
			}),
			/* @__PURE__ */ jsx("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ jsxs("dl", {
					className: "grid grid-cols-2 gap-3 text-sm",
					children: [
						/* @__PURE__ */ jsx(Item, {
							k: "Nhóm",
							v: g?.name ?? "—"
						}),
						/* @__PURE__ */ jsx(Item, {
							k: "Ca",
							v: s ? `${s.name} ${s.startTime}–${s.endTime}` : "—"
						}),
						/* @__PURE__ */ jsx(Item, {
							k: "Quyền",
							v: ROLE_LABEL[person.role]
						}),
						/* @__PURE__ */ jsx(Item, {
							k: "Trạng thái",
							v: /* @__PURE__ */ jsx(EmployeeBadge, { status: person.status })
						}),
						/* @__PURE__ */ jsx(Item, {
							k: "SBD",
							v: person.serialNumber || "—"
						}),
						/* @__PURE__ */ jsx(Item, {
							k: "Ghi chú",
							v: person.note || "—"
						})
					]
				})
			}),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
				className: "mb-2 text-sm font-medium text-muted",
				children: "Chấm công gần đây"
			}), /* @__PURE__ */ jsxs("ul", {
				className: "divide-y divide-border rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]",
				children: [attendance.slice(0, 8).map((a) => /* @__PURE__ */ jsxs("li", {
					className: "flex min-h-12 items-center justify-between text-sm",
					children: [/* @__PURE__ */ jsx("span", { children: a.date }), /* @__PURE__ */ jsxs("span", {
						className: "font-mono text-muted tabular-nums",
						children: [
							a.checkIn ? formatDateTime(a.checkIn) : "—",
							" → ",
							a.checkOut ? formatDateTime(a.checkOut) : "—"
						]
					})]
				}, a.id)), attendance.length === 0 ? /* @__PURE__ */ jsx("li", {
					className: "py-4 text-sm text-muted",
					children: "Chưa có"
				}) : null]
			})] }),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
				className: "mb-2 text-sm font-medium text-muted",
				children: "OT"
			}), /* @__PURE__ */ jsxs("p", {
				className: "text-sm text-muted",
				children: [
					ots.length,
					" phiếu · ",
					Math.round(ots.reduce((s, o) => s + o.totalMinutes, 0) / 6) / 10,
					" giờ"
				]
			})] }),
			can(role, "manage_people") ? /* @__PURE__ */ jsx(Button, {
				variant: "danger",
				className: "w-full",
				onClick: async () => {
					if (!confirm("Xóa nhân sự này?")) return;
					await deleteEmployee(id);
					toast.success("Đã xóa");
					nav({ to: "/people" });
				},
				children: "Xóa nhân sự"
			}) : null,
			/* @__PURE__ */ jsx(PersonForm, {
				open: edit,
				onClose: () => setEdit(false),
				groups,
				shifts,
				initial: person,
				onSave: async (data) => {
					await updateEmployee(id, data);
					toast.success("Đã cập nhật");
					setEdit(false);
				}
			})
		]
	});
}
function Item({ k, v }) {
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
		className: "text-xs text-muted",
		children: k
	}), /* @__PURE__ */ jsx("dd", {
		className: "mt-0.5",
		children: v
	})] });
}
//#endregion
export { PersonDetail as component };
