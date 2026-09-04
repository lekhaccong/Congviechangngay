import { h as getDb } from "./store-Crr6urgA.js";
import { L as upsertGoods, g as deleteGoods } from "./repo-CgXr20UM.js";
import { t as useRow } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { i as Textarea, r as NativeSelect } from "./input-D0c9ilIZ.js";
import { l as GOODS_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { r as Route } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { o as GoodsBadge } from "./status-badge-DvBF2MJq.js";
import { t as PhotoStrip } from "./photo-strip-ByIBfJVk.js";
import { i as missingGoodsMail } from "./mail-kbJnmCg5.js";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/goods.export.$id.tsx?tsr-split=component
function ExportDetail() {
	const { id } = Route.useParams();
	const nav = useNavigate();
	const item = useRow(() => getDb().goodsItems.get(id), [id]);
	if (!item) return /* @__PURE__ */ jsx("p", {
		className: "text-muted",
		children: "Không tìm thấy hàng xuất."
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: item.productCode,
				subtitle: item.invoice,
				back: "/goods",
				action: /* @__PURE__ */ jsx(GoodsBadge, { status: item.status })
			}),
			/* @__PURE__ */ jsxs("dl", {
				className: "grid grid-cols-2 gap-3 rounded-xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Mã hàng"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono",
						children: item.itemCode
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Lot"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono",
						children: item.lot
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "SL"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono tabular-nums",
						children: item.quantity
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Ngày xuất"
					}), /* @__PURE__ */ jsx("dd", { children: item.exportDate })] })
				]
			}),
			/* @__PURE__ */ jsx(NativeSelect, {
				value: item.status,
				onChange: (e) => void upsertGoods({
					...item,
					status: e.target.value,
					id: item.id
				}),
				children: Object.keys(GOODS_STATUS_LABEL).map((s) => /* @__PURE__ */ jsx("option", {
					value: s,
					children: GOODS_STATUS_LABEL[s]
				}, s))
			}),
			/* @__PURE__ */ jsx(Textarea, {
				defaultValue: item.note,
				onBlur: (e) => {
					if (e.target.value !== item.note) upsertGoods({
						...item,
						note: e.target.value,
						id: item.id
					});
				}
			}),
			/* @__PURE__ */ jsx(PhotoStrip, {
				ownerModule: "goodsItems",
				ownerId: id
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ jsx(Button, {
					variant: "secondary",
					onClick: () => missingGoodsMail({
						productCode: item.productCode,
						invoice: item.invoice,
						lot: item.lot,
						note: item.note
					}),
					children: "Mail hàng thiếu"
				}), /* @__PURE__ */ jsx(Button, {
					variant: "danger",
					onClick: async () => {
						if (!confirm("Xóa phiếu xuất?")) return;
						await deleteGoods(id);
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
export { ExportDetail as component };
