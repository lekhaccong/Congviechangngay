import { a as formatDateTime, h as getDb } from "./store-Crr6urgA.js";
import { I as upsertDataItem, m as deleteDataItem } from "./repo-CgXr20UM.js";
import { t as useRow } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { i as Textarea, r as NativeSelect } from "./input-D0c9ilIZ.js";
import { s as DATA_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { i as Route } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { i as DataBadge } from "./status-badge-DvBF2MJq.js";
import { t as PhotoStrip } from "./photo-strip-ByIBfJVk.js";
import { r as missingDataMail } from "./mail-kbJnmCg5.js";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/goods.data.$id.tsx?tsr-split=component
function DataDetail() {
	const { id } = Route.useParams();
	const nav = useNavigate();
	const item = useRow(() => getDb().dataItems.get(id), [id]);
	if (!item) return /* @__PURE__ */ jsx("p", {
		className: "text-muted",
		children: "Không tìm thấy DATA."
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: item.productCode,
				subtitle: item.invoice,
				back: "/goods",
				action: /* @__PURE__ */ jsx(DataBadge, { status: item.status })
			}),
			/* @__PURE__ */ jsxs("dl", {
				className: "grid grid-cols-2 gap-3 rounded-xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Thiết kế"
					}), /* @__PURE__ */ jsx("dd", { children: item.designCode || "—" })] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Lot"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono",
						children: item.lot
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Số lượng"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono tabular-nums",
						children: item.quantity
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Nhận lúc"
					}), /* @__PURE__ */ jsx("dd", { children: formatDateTime(item.receivedAt) })] })
				]
			}),
			/* @__PURE__ */ jsx(NativeSelect, {
				value: item.status,
				onChange: (e) => void upsertDataItem({
					...item,
					status: e.target.value,
					id: item.id
				}),
				children: Object.keys(DATA_STATUS_LABEL).map((s) => /* @__PURE__ */ jsx("option", {
					value: s,
					children: DATA_STATUS_LABEL[s]
				}, s))
			}),
			/* @__PURE__ */ jsx(Textarea, {
				defaultValue: item.note,
				onBlur: (e) => {
					if (e.target.value !== item.note) upsertDataItem({
						...item,
						note: e.target.value,
						id: item.id
					});
				}
			}),
			/* @__PURE__ */ jsx(PhotoStrip, {
				ownerModule: "dataItems",
				ownerId: id
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ jsx(Button, {
					variant: "secondary",
					onClick: () => missingDataMail({
						productCode: item.productCode,
						invoice: item.invoice,
						note: item.note
					}),
					children: "Mail thiếu DATA"
				}), /* @__PURE__ */ jsx(Button, {
					variant: "danger",
					onClick: async () => {
						if (!confirm("Xóa DATA?")) return;
						await deleteDataItem(id);
						toast.success("Đã xóa");
						nav({ to: "/goods" });
					},
					children: "Xóa"
				})]
			})
		]
	});
}
//#endregion
export { DataDetail as component };
