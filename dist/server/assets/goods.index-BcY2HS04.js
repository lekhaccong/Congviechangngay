import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { I as upsertDataItem, L as upsertGoods, R as upsertLot } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { i as Textarea, n as Input, t as Field } from "./input-D0c9ilIZ.js";
import { l as GOODS_STATUS_LABEL, s as DATA_STATUS_LABEL, u as LOT_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { i as DataBadge, o as GoodsBadge, s as LotBadge } from "./status-badge-DvBF2MJq.js";
import { t as FilterChip } from "./filter-chip-TMIIHD5x.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/goods.index.tsx?tsr-split=component
function GoodsPage() {
	const date = useAppStore((s) => s.selectedDate);
	const role = useAppStore((s) => s.role);
	const [tab, setTab] = useState("data");
	const [status, setStatus] = useState("all");
	const [open, setOpen] = useState(false);
	const data = useRows(() => getDb().dataItems.reverse().sortBy("createdAt"));
	const goods = useRows(() => getDb().goodsItems.reverse().sortBy("createdAt"));
	const lots = useRows(() => getDb().lots.reverse().sortBy("createdAt"));
	const dataShown = data.filter((d) => status === "all" || d.status === status);
	const goodsShown = goods.filter((d) => status === "all" || d.status === status);
	const lotsShown = lots.filter((d) => status === "all" || d.status === status);
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "Hàng",
			subtitle: "DATA · Xuất · Lot",
			action: can(role, "manage_goods") ? /* @__PURE__ */ jsx(Button, {
				size: "sm",
				onClick: () => setOpen(true),
				children: "Thêm"
			}) : null
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-3 grid grid-cols-3 gap-2",
			children: [
				"data",
				"export",
				"lot"
			].map((t) => /* @__PURE__ */ jsx(Button, {
				variant: tab === t ? "default" : "secondary",
				onClick: () => {
					setTab(t);
					setStatus("all");
				},
				children: t === "data" ? "DATA" : t === "export" ? "Hàng xuất" : "Lot"
			}, t))
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex gap-2 overflow-x-auto",
			children: [/* @__PURE__ */ jsx(FilterChip, {
				active: status === "all",
				onClick: () => setStatus("all"),
				children: "Tất cả"
			}), tab === "data" ? Object.keys(DATA_STATUS_LABEL).map((s) => /* @__PURE__ */ jsx(FilterChip, {
				active: status === s,
				onClick: () => setStatus(s),
				children: DATA_STATUS_LABEL[s]
			}, s)) : tab === "export" ? Object.keys(GOODS_STATUS_LABEL).map((s) => /* @__PURE__ */ jsx(FilterChip, {
				active: status === s,
				onClick: () => setStatus(s),
				children: GOODS_STATUS_LABEL[s]
			}, s)) : Object.keys(LOT_STATUS_LABEL).map((s) => /* @__PURE__ */ jsx(FilterChip, {
				active: status === s,
				onClick: () => setStatus(s),
				children: LOT_STATUS_LABEL[s]
			}, s))]
		}),
		tab === "data" ? dataShown.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "Chưa có DATA" }) : /* @__PURE__ */ jsx("ul", {
			className: "space-y-2",
			children: dataShown.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
				to: "/goods/data/$id",
				params: { id: d.id },
				className: "flex items-center justify-between rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "font-medium",
					children: d.productCode
				}), /* @__PURE__ */ jsxs("p", {
					className: "font-mono text-xs text-muted",
					children: [
						d.invoice,
						" · ",
						d.lot,
						" · SL ",
						d.quantity
					]
				})] }), /* @__PURE__ */ jsx(DataBadge, { status: d.status })]
			}) }, d.id))
		}) : null,
		tab === "export" ? goodsShown.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "Chưa có hàng xuất" }) : /* @__PURE__ */ jsx("ul", {
			className: "space-y-2",
			children: goodsShown.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
				to: "/goods/export/$id",
				params: { id: d.id },
				className: "flex items-center justify-between rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "font-medium",
					children: d.productCode
				}), /* @__PURE__ */ jsxs("p", {
					className: "font-mono text-xs text-muted",
					children: [
						d.invoice,
						" · ",
						d.lot
					]
				})] }), /* @__PURE__ */ jsx(GoodsBadge, { status: d.status })]
			}) }, d.id))
		}) : null,
		tab === "lot" ? lotsShown.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "Chưa có Lot" }) : /* @__PURE__ */ jsx("ul", {
			className: "space-y-2",
			children: lotsShown.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
				to: "/goods/lot/$id",
				params: { id: d.id },
				className: "flex items-center justify-between rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "font-medium",
					children: d.lotCode
				}), /* @__PURE__ */ jsxs("p", {
					className: "font-mono text-xs text-muted",
					children: [
						d.invoice,
						" · ",
						d.productCode,
						" · SL ",
						d.quantity
					]
				})] }), /* @__PURE__ */ jsx(LotBadge, { status: d.status })]
			}) }, d.id))
		}) : null,
		/* @__PURE__ */ jsx(AddGoodsDialog, {
			open,
			onClose: () => setOpen(false),
			tab,
			date
		})
	] });
}
function AddGoodsDialog({ open, onClose, tab, date }) {
	const [productCode, setPc] = useState("");
	const [designCode, setDc] = useState("");
	const [invoice, setInv] = useState("");
	const [lot, setLot] = useState("");
	const [qty, setQty] = useState("0");
	const [note, setNote] = useState("");
	const [itemCode, setItem] = useState("");
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onClose,
		title: tab === "data" ? "DATA mới" : tab === "export" ? "Hàng xuất mới" : "Lot mới",
		children: /* @__PURE__ */ jsxs("form", {
			className: "space-y-3",
			onSubmit: async (e) => {
				e.preventDefault();
				const quantity = Number(qty) || 0;
				if (tab === "data") await upsertDataItem({
					productCode,
					designCode,
					receivedAt: Date.now(),
					invoice,
					lot,
					quantity,
					status: "NEW",
					note
				});
				else if (tab === "export") await upsertGoods({
					invoice,
					itemCode: itemCode || productCode,
					productCode,
					lot,
					quantity,
					exportDate: date,
					status: "WAITING",
					note
				});
				else await upsertLot({
					lotCode: lot,
					invoice,
					productCode,
					date,
					quantity,
					status: "OPEN"
				});
				toast.success("Đã lưu");
				setPc("");
				setInv("");
				setLot("");
				onClose();
			},
			children: [
				/* @__PURE__ */ jsx(Field, {
					label: "Mã SP",
					children: /* @__PURE__ */ jsx(Input, {
						value: productCode,
						onChange: (e) => setPc(e.target.value),
						required: true
					})
				}),
				tab === "data" ? /* @__PURE__ */ jsx(Field, {
					label: "Mã thiết kế",
					children: /* @__PURE__ */ jsx(Input, {
						value: designCode,
						onChange: (e) => setDc(e.target.value)
					})
				}) : null,
				tab === "export" ? /* @__PURE__ */ jsx(Field, {
					label: "Mã hàng",
					children: /* @__PURE__ */ jsx(Input, {
						value: itemCode,
						onChange: (e) => setItem(e.target.value)
					})
				}) : null,
				/* @__PURE__ */ jsx(Field, {
					label: "Invoice",
					children: /* @__PURE__ */ jsx(Input, {
						value: invoice,
						onChange: (e) => setInv(e.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Lot",
					children: /* @__PURE__ */ jsx(Input, {
						value: lot,
						onChange: (e) => setLot(e.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Số lượng",
					children: /* @__PURE__ */ jsx(Input, {
						type: "number",
						value: qty,
						onChange: (e) => setQty(e.target.value)
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
					children: "Lưu"
				})
			]
		})
	});
}
//#endregion
export { GoodsPage as component };
