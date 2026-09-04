import { a as formatDateTime, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { A as toggleChecklistItem, B as PROGRESS_STEPS, F as updateTask, b as deleteTask, k as setTaskProgress } from "./repo-CgXr20UM.js";
import { n as useRows, t as useRow } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { i as Textarea } from "./input-D0c9ilIZ.js";
import { a as Route } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { c as TaskBadge } from "./status-badge-DvBF2MJq.js";
import { t as PhotoStrip } from "./photo-strip-ByIBfJVk.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/tasks.$id.tsx?tsr-split=component
function TaskDetail() {
	const { id } = Route.useParams();
	const nav = useNavigate();
	const role = useAppStore((s) => s.role);
	const task = useRow(() => getDb().tasks.get(id), [id]);
	const people = useRows(() => getDb().employees.toArray());
	const blocks = useRows(() => getDb().workBlocks.toArray());
	const logs = useRows(() => getDb().auditLogs.filter((l) => l.recordId === id).reverse().sortBy("timestamp"), [id]);
	const checklist = useRows(() => getDb().checklists.filter((c) => c.blockId === (task?.blockId ?? "")).toArray(), [task?.blockId]);
	const items = useRows(async () => {
		const ids = checklist.map((c) => c.id);
		if (!ids.length) return [];
		return getDb().checklistItems.filter((i) => ids.includes(i.checklistId) && (i.taskId === null || i.taskId === id)).toArray();
	}, [checklist, id]);
	const [note, setNote] = useState(null);
	if (!task) return /* @__PURE__ */ jsx("p", {
		className: "text-muted",
		children: "Không tìm thấy công việc."
	});
	const who = people.find((p) => p.id === task.assigneeId);
	const block = blocks.find((b) => b.id === task.blockId);
	const noteVal = note ?? task.note;
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: task.name,
				subtitle: block?.name,
				back: "/tasks",
				action: /* @__PURE__ */ jsx(TaskBadge, { status: task.status })
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "text-sm text-muted",
				children: [who?.name ?? "Chưa gán", task.deadline ? ` · hạn ${formatDateTime(task.deadline)}` : ""]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-sm font-medium text-muted",
							children: "Tiến độ"
						}), /* @__PURE__ */ jsxs("span", {
							className: "font-mono tabular-nums",
							children: [task.progress, "%"]
						})]
					}),
					/* @__PURE__ */ jsx("input", {
						type: "range",
						min: 0,
						max: 100,
						step: 5,
						value: task.progress,
						className: "w-full accent-primary",
						onChange: (e) => void setTaskProgress(id, Number(e.target.value))
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-3 grid grid-cols-5 gap-2",
						children: PROGRESS_STEPS.map((p) => /* @__PURE__ */ jsxs(Button, {
							size: "sm",
							variant: task.progress === p ? "default" : "secondary",
							onClick: () => void setTaskProgress(id, p),
							children: [p, "%"]
						}, p))
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-3 text-sm font-medium text-muted",
					children: "Checklist"
				}), /* @__PURE__ */ jsxs("ul", {
					className: "space-y-2",
					children: [items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("label", {
						className: "flex min-h-12 items-center gap-3",
						children: [/* @__PURE__ */ jsx("input", {
							type: "checkbox",
							className: "size-5 accent-primary",
							checked: item.done,
							onChange: (e) => void toggleChecklistItem(item.id, e.target.checked)
						}), /* @__PURE__ */ jsx("span", {
							className: item.done ? "text-muted line-through" : "",
							children: item.label
						})]
					}) }, item.id)), items.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Khối này chưa có checklist."
					}) : null]
				})]
			}),
			/* @__PURE__ */ jsx(PhotoStrip, {
				ownerModule: "tasks",
				ownerId: id
			}),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
				className: "mb-2 text-sm font-medium text-muted",
				children: "Ghi chú"
			}), /* @__PURE__ */ jsx(Textarea, {
				value: noteVal,
				onChange: (e) => setNote(e.target.value),
				onBlur: () => {
					if (note !== null && note !== task.note) updateTask(id, { note });
				}
			})] }),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
				className: "mb-2 text-sm font-medium text-muted",
				children: "Lịch sử"
			}), /* @__PURE__ */ jsxs("ol", {
				className: "space-y-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [logs.map((l) => /* @__PURE__ */ jsxs("li", {
					className: "flex gap-3 text-sm",
					children: [/* @__PURE__ */ jsx("span", {
						className: "w-14 shrink-0 font-mono tabular-nums text-muted",
						children: formatDateTime(l.timestamp).split(" ")[1]
					}), /* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "text-muted",
							children: l.userName
						}),
						" ",
						labelAction(l.action)
					] })]
				}, l.id)), logs.length === 0 ? /* @__PURE__ */ jsx("li", {
					className: "text-sm text-muted",
					children: "Chưa có lịch sử"
				}) : null]
			})] }),
			can(role, "manage_tasks") ? /* @__PURE__ */ jsx(Button, {
				variant: "danger",
				className: "w-full",
				onClick: async () => {
					if (!confirm("Xóa công việc?")) return;
					await deleteTask(id);
					toast.success("Đã xóa");
					nav({ to: "/tasks" });
				},
				children: "Xóa công việc"
			}) : null
		]
	});
}
function labelAction(a) {
	return {
		CREATE: "tạo việc",
		UPDATE: "cập nhật",
		COMPLETE: "hoàn thành",
		PROGRESS: "cập nhật tiến độ",
		PHOTO: "chụp ảnh",
		DELETE: "xóa"
	}[a] ?? a;
}
//#endregion
export { TaskDetail as component };
