import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { c as TaskBadge, i as DataBadge, o as GoodsBadge, s as LotBadge, t as AbnormalBadge } from "./status-badge-DvBF2MJq.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/unfinished.tsx?tsr-split=component
function UnfinishedPage() {
	const date = useAppStore((s) => s.selectedDate);
	const dataMissing = useRows(() => getDb().dataItems.filter((d) => d.status === "MISSING" || d.status === "NEW" || d.status === "PROCESSING").toArray());
	const goodsOpen = useRows(() => getDb().goodsItems.filter((g) => g.status !== "COMPLETED" && g.status !== "ENOUGH").toArray());
	const lotsOpen = useRows(() => getDb().lots.filter((l) => l.status !== "CLOSED").toArray());
	const tasks = useRows(() => getDb().tasks.filter((t) => t.date === date && t.status !== "COMPLETED").toArray(), [date]);
	const threeS = useRows(() => getDb().threeS.filter((t) => t.date === date && !t.completedAt).toArray(), [date]);
	const abs = useRows(() => getDb().abnormalities.filter((a) => a.status === "NEW" || a.status === "PROCESSING").toArray());
	const total = dataMissing.length + goodsOpen.length + lotsOpen.length + tasks.length + threeS.length + abs.length;
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "Việc chưa xong",
			subtitle: `${total} mục cần xử lý trong ca`
		}),
		total === 0 ? /* @__PURE__ */ jsx(EmptyState, {
			title: "Ca đang sạch",
			hint: "Không còn DATA thiếu, lot chưa chốt hay việc quá hạn."
		}) : /* @__PURE__ */ jsxs("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ jsxs(Section, {
					title: "DATA thiếu / chưa xong",
					children: [dataMissing.map((d) => /* @__PURE__ */ jsxs(Link, {
						to: "/goods/data/$id",
						params: { id: d.id },
						className: "row",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: d.productCode
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-xs text-muted",
							children: [
								d.invoice,
								" · ",
								d.lot
							]
						})] }), /* @__PURE__ */ jsx(DataBadge, { status: d.status })]
					}, d.id)), dataMissing.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không có"
					}) : null]
				}),
				/* @__PURE__ */ jsxs(Section, {
					title: "Hàng chưa hoàn thành",
					children: [goodsOpen.map((g) => /* @__PURE__ */ jsxs(Link, {
						to: "/goods/export/$id",
						params: { id: g.id },
						className: "row",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: g.productCode
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-muted",
							children: g.invoice
						})] }), /* @__PURE__ */ jsx(GoodsBadge, { status: g.status })]
					}, g.id)), goodsOpen.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không có"
					}) : null]
				}),
				/* @__PURE__ */ jsxs(Section, {
					title: "Lot chưa chốt",
					children: [lotsOpen.map((l) => /* @__PURE__ */ jsxs(Link, {
						to: "/goods/lot/$id",
						params: { id: l.id },
						className: "row",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: l.lotCode
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-muted",
							children: l.invoice
						})] }), /* @__PURE__ */ jsx(LotBadge, { status: l.status })]
					}, l.id)), lotsOpen.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không có"
					}) : null]
				}),
				/* @__PURE__ */ jsxs(Section, {
					title: "Công việc chưa xong / quá hạn",
					children: [tasks.map((t) => /* @__PURE__ */ jsxs(Link, {
						to: "/tasks/$id",
						params: { id: t.id },
						className: "row",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: t.name
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-xs text-muted",
							children: [t.progress, "%"]
						})] }), /* @__PURE__ */ jsx(TaskBadge, { status: t.status })]
					}, t.id)), tasks.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không có"
					}) : null]
				}),
				/* @__PURE__ */ jsxs(Section, {
					title: "3S chưa hoàn thành",
					children: [threeS.map((t) => /* @__PURE__ */ jsx(Link, {
						to: "/threes",
						className: "row",
						children: /* @__PURE__ */ jsxs("p", {
							className: "font-medium",
							children: ["Checklist 3S ", t.date]
						})
					}, t.id)), threeS.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không có"
					}) : null]
				}),
				/* @__PURE__ */ jsxs(Section, {
					title: "Bất thường chưa xử lý",
					children: [abs.map((a) => /* @__PURE__ */ jsxs(Link, {
						to: "/abnormal/$id",
						params: { id: a.id },
						className: "row",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium",
							children: a.type
						}), /* @__PURE__ */ jsx("p", {
							className: "line-clamp-1 text-xs text-muted",
							children: a.description
						})] }), /* @__PURE__ */ jsx(AbnormalBadge, { status: a.status })]
					}, a.id)), abs.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không có"
					}) : null]
				})
			]
		}),
		/* @__PURE__ */ jsx("style", { children: `.row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;padding:12px 0;border-bottom:1px solid var(--color-border)}` })
	] });
}
function Section({ title, children }) {
	return /* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
		className: "mb-1 text-xs font-medium uppercase tracking-wide text-muted",
		children: title
	}), /* @__PURE__ */ jsx("div", {
		className: "rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]",
		children
	})] });
}
//#endregion
export { UnfinishedPage as component };
