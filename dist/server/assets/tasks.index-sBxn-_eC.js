import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { E as reorderBlocks, N as updateBlock, o as createBlock, p as deleteBlock, u as createTask } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { i as Textarea, n as Input, r as NativeSelect, t as Field } from "./input-D0c9ilIZ.js";
import { h as TASK_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { c as TaskBadge } from "./status-badge-DvBF2MJq.js";
import { t as FilterChip } from "./filter-chip-TMIIHD5x.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/tasks.index.tsx?tsr-split=component
function TasksPage() {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const role = useAppStore((s) => s.role);
	const tasks = useRows(() => getDb().tasks.filter((t) => t.date === date && (!shiftId || t.shiftId === shiftId)).toArray(), [date, shiftId]);
	const blocks = useRows(() => getDb().workBlocks.orderBy("order").toArray());
	const people = useRows(() => getDb().employees.toArray());
	const [filter, setFilter] = useState("all");
	const [open, setOpen] = useState(false);
	const [blockOpen, setBlockOpen] = useState(false);
	const shown = tasks.filter((t) => {
		if (filter === "all" || filter === "today") return true;
		return t.status === filter;
	});
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "Công việc",
			subtitle: `${shown.length} việc trong ca`,
			action: can(role, "manage_tasks") ? /* @__PURE__ */ jsxs("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ jsx(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => setBlockOpen(true),
					children: "Khối"
				}), /* @__PURE__ */ jsx(Button, {
					size: "sm",
					onClick: () => setOpen(true),
					children: "Thêm"
				})]
			}) : null
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-3 flex gap-2 overflow-x-auto",
			children: [
				"all",
				"IN_PROGRESS",
				"OVERDUE",
				"COMPLETED"
			].map((f) => /* @__PURE__ */ jsx(FilterChip, {
				active: filter === f,
				onClick: () => setFilter(f),
				children: f === "all" ? "Tất cả" : TASK_STATUS_LABEL[f]
			}, f))
		}),
		shown.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
			title: "Chưa có công việc",
			hint: "Tạo việc theo khối DATA, hàng xuất, lot…"
		}) : /* @__PURE__ */ jsx("ul", {
			className: "space-y-2",
			children: shown.map((t) => {
				const block = blocks.find((b) => b.id === t.blockId);
				const who = people.find((p) => p.id === t.assigneeId);
				return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/tasks/$id",
					params: { id: t.id },
					className: "block rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "font-medium",
								children: t.name
							}), /* @__PURE__ */ jsxs("p", {
								className: "text-xs text-muted",
								children: [
									block?.name,
									" · ",
									who?.name ?? "Chưa gán"
								]
							})] }), /* @__PURE__ */ jsx(TaskBadge, { status: t.status })]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 h-2 overflow-hidden rounded-full bg-surface-2",
							children: /* @__PURE__ */ jsx("div", {
								className: "h-full bg-primary",
								style: { width: `${t.progress}%` }
							})
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-1 font-mono text-xs tabular-nums text-muted",
							children: [t.progress, "%"]
						})
					]
				}) }, t.id);
			})
		}),
		/* @__PURE__ */ jsx(TaskCreate, {
			open,
			onClose: () => setOpen(false),
			blocks,
			people
		}),
		/* @__PURE__ */ jsx(BlockManager, {
			open: blockOpen,
			onClose: () => setBlockOpen(false),
			blocks
		})
	] });
}
function TaskCreate({ open, onClose, blocks, people }) {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const [name, setName] = useState("");
	const [blockId, setBlockId] = useState(blocks[0]?.id ?? "");
	const [assigneeId, setAssignee] = useState(people[0]?.id ?? "");
	const [minutes, setMinutes] = useState("30");
	const [note, setNote] = useState("");
	const [deadlineLocal, setDeadline] = useState("");
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onClose,
		title: "Công việc mới",
		children: /* @__PURE__ */ jsxs("form", {
			className: "space-y-3",
			onSubmit: async (e) => {
				e.preventDefault();
				await createTask({
					name,
					blockId,
					assigneeId,
					date,
					shiftId: shiftId ?? "",
					estimatedMinutes: Number(minutes) || 30,
					deadline: deadlineLocal ? new Date(deadlineLocal).getTime() : Date.now() + 144e5,
					reminderTime: deadlineLocal ? new Date(deadlineLocal).getTime() - 18e5 : null,
					note
				});
				toast.success("Đã tạo công việc");
				setName("");
				onClose();
			},
			children: [
				/* @__PURE__ */ jsx(Field, {
					label: "Tên",
					children: /* @__PURE__ */ jsx(Input, {
						value: name,
						onChange: (e) => setName(e.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Khối",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: blockId,
						onChange: (e) => setBlockId(e.target.value),
						children: blocks.map((b) => /* @__PURE__ */ jsx("option", {
							value: b.id,
							children: b.name
						}, b.id))
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Người làm",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: assigneeId,
						onChange: (e) => setAssignee(e.target.value),
						children: people.map((p) => /* @__PURE__ */ jsx("option", {
							value: p.id,
							children: p.name
						}, p.id))
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Thời gian dự kiến (phút)",
					children: /* @__PURE__ */ jsx(Input, {
						type: "number",
						value: minutes,
						onChange: (e) => setMinutes(e.target.value)
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Deadline",
					children: /* @__PURE__ */ jsx(Input, {
						type: "datetime-local",
						value: deadlineLocal,
						onChange: (e) => setDeadline(e.target.value)
					})
				}),
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
					children: "Tạo"
				})
			]
		})
	});
}
function BlockManager({ open, onClose, blocks }) {
	const [name, setName] = useState("");
	return /* @__PURE__ */ jsxs(Dialog, {
		open,
		onClose,
		title: "Khối công việc",
		children: [/* @__PURE__ */ jsx("ul", {
			className: "space-y-2",
			children: blocks.map((b, i) => /* @__PURE__ */ jsxs("li", {
				className: "flex gap-2",
				children: [
					/* @__PURE__ */ jsx(Input, {
						defaultValue: b.name,
						onBlur: (e) => {
							const v = e.target.value.trim();
							if (v && v !== b.name) updateBlock(b.id, v);
						}
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "secondary",
						size: "sm",
						disabled: i === 0,
						onClick: () => {
							const ids = blocks.map((x) => x.id);
							[ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
							reorderBlocks(ids);
						},
						children: "Lên"
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "danger",
						size: "sm",
						onClick: async () => {
							try {
								await deleteBlock(b.id);
							} catch (e) {
								toast.error(e instanceof Error ? e.message : "Không xóa được");
							}
						},
						children: "Xóa"
					})
				]
			}, b.id))
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex gap-2",
			children: [/* @__PURE__ */ jsx(Input, {
				value: name,
				onChange: (e) => setName(e.target.value),
				placeholder: "Khối mới"
			}), /* @__PURE__ */ jsx(Button, {
				onClick: async () => {
					if (!name.trim()) return;
					await createBlock(name.trim());
					setName("");
				},
				children: "Thêm"
			})]
		})]
	});
}
//#endregion
export { TasksPage as component };
