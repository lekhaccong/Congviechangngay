import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { A as toggleChecklistItem, d as createThreeS } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { t as PhotoStrip } from "./photo-strip-ByIBfJVk.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/threes.tsx?tsr-split=component
function ThreeSPage() {
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const records = useRows(() => getDb().threeS.filter((t) => t.date === date && (!shiftId || t.shiftId === shiftId)).toArray(), [date, shiftId]);
	const items = useRows(() => getDb().checklistItems.filter((i) => i.threeSId !== null).toArray());
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ jsx(PageHeader, {
			title: "3S / 3D",
			subtitle: "Checklist khu vực trong ca",
			action: /* @__PURE__ */ jsx(Button, {
				size: "sm",
				onClick: async () => {
					if (!shiftId) {
						toast.error("Chưa chọn ca");
						return;
					}
					await createThreeS(date, shiftId);
					toast.success("Đã tạo checklist 3S");
				},
				children: "Checklist mới"
			})
		}), records.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
			title: "Chưa có checklist 3S cho ca này",
			hint: "Tạo một phiếu cho khu vực đang làm."
		}) : records.map((rec) => {
			const recItems = items.filter((i) => i.threeSId === rec.id).sort((a, b) => a.order - b.order);
			const done = recItems.filter((i) => i.done).length;
			return /* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "font-medium",
							children: rec.note || "Khu vực ca"
						}), /* @__PURE__ */ jsxs("span", {
							className: "font-mono text-sm tabular-nums text-muted",
							children: [
								done,
								"/",
								recItems.length
							]
						})]
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "space-y-1",
						children: recItems.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("label", {
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
						}) }, item.id))
					}),
					/* @__PURE__ */ jsx(PhotoStrip, {
						ownerModule: "threeS",
						ownerId: rec.id
					})
				]
			}, rec.id);
		})]
	});
}
//#endregion
export { ThreeSPage as component };
