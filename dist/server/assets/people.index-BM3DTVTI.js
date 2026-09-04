import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { T as renameGroup, _ as deleteGroup, c as createGroup, s as createEmployee } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { n as Input } from "./input-D0c9ilIZ.js";
import { p as ROLE_LABEL } from "./types-hR0syAmZ.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { a as EmployeeBadge } from "./status-badge-DvBF2MJq.js";
import { t as FilterChip } from "./filter-chip-TMIIHD5x.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { t as PersonForm } from "./person-form-ugKqjdik.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/people.index.tsx?tsr-split=component
function PeoplePage() {
	const role = useAppStore((s) => s.role);
	const people = useRows(() => getDb().employees.orderBy("code").toArray());
	const groups = useRows(() => getDb().groups.orderBy("order").toArray());
	const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
	const [groupFilter, setGroupFilter] = useState("all");
	const [open, setOpen] = useState(false);
	const [groupOpen, setGroupOpen] = useState(false);
	const [newGroup, setNewGroup] = useState("");
	const filtered = people.filter((p) => groupFilter === "all" || p.groupId === groupFilter);
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "Nhân sự",
			subtitle: `${people.length} người`,
			action: can(role, "manage_people") ? /* @__PURE__ */ jsx(Button, {
				size: "sm",
				onClick: () => setOpen(true),
				children: "Thêm"
			}) : null
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex gap-2 overflow-x-auto",
			children: [
				/* @__PURE__ */ jsx(FilterChip, {
					active: groupFilter === "all",
					onClick: () => setGroupFilter("all"),
					children: "Tất cả"
				}),
				groups.map((g) => /* @__PURE__ */ jsx(FilterChip, {
					active: groupFilter === g.id,
					onClick: () => setGroupFilter(g.id),
					children: g.name
				}, g.id)),
				can(role, "manage_people") ? /* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => setGroupOpen(true),
					children: "Nhóm"
				}) : null
			]
		}),
		filtered.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
			title: "Chưa có nhân sự",
			hint: "Thêm người để chấm công và giao việc."
		}) : /* @__PURE__ */ jsx("ul", {
			className: "divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
			children: filtered.map((p) => {
				const g = groups.find((x) => x.id === p.groupId);
				const s = shifts.find((x) => x.id === p.shiftId);
				return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/people/$id",
					params: { id: p.id },
					className: "flex min-h-16 items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: p.name
						}), /* @__PURE__ */ jsxs("p", {
							className: "font-mono text-xs text-muted",
							children: [
								p.code,
								" · ",
								g?.name,
								" · ",
								s?.name,
								" · ",
								ROLE_LABEL[p.role]
							]
						})]
					}), /* @__PURE__ */ jsx(EmployeeBadge, { status: p.status })]
				}) }, p.id);
			})
		}),
		/* @__PURE__ */ jsx(PersonForm, {
			open,
			onClose: () => setOpen(false),
			groups,
			shifts,
			onSave: async (data) => {
				await createEmployee(data);
				toast.success("Đã thêm nhân sự");
				setOpen(false);
			}
		}),
		/* @__PURE__ */ jsxs(Dialog, {
			open: groupOpen,
			onClose: () => setGroupOpen(false),
			title: "Nhóm",
			children: [/* @__PURE__ */ jsx("ul", {
				className: "mb-4 space-y-2",
				children: groups.map((g) => /* @__PURE__ */ jsxs("li", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ jsx(Input, {
						defaultValue: g.name,
						onBlur: (e) => {
							const v = e.target.value.trim();
							if (v && v !== g.name) renameGroup(g.id, v);
						}
					}), /* @__PURE__ */ jsx(Button, {
						variant: "danger",
						size: "sm",
						onClick: async () => {
							try {
								await deleteGroup(g.id);
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Không xóa được");
							}
						},
						children: "Xóa"
					})]
				}, g.id))
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ jsx(Input, {
					value: newGroup,
					onChange: (e) => setNewGroup(e.target.value),
					placeholder: "Tên nhóm mới"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: async () => {
						if (!newGroup.trim()) return;
						await createGroup(newGroup.trim());
						setNewGroup("");
					},
					children: "Thêm"
				})]
			})]
		})
	] });
}
//#endregion
export { PeoplePage as component };
