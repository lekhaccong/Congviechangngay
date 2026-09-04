import { h as getDb } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { n as Input } from "./input-D0c9ilIZ.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/search.tsx?tsr-split=component
function SearchPage() {
	const [q, setQ] = useState("");
	const needle = q.trim().toLowerCase();
	const people = useRows(() => getDb().employees.toArray());
	const tasks = useRows(() => getDb().tasks.toArray());
	const data = useRows(() => getDb().dataItems.toArray());
	const goods = useRows(() => getDb().goodsItems.toArray());
	const lots = useRows(() => getDb().lots.toArray());
	const peopleHits = needle ? people.filter((p) => p.name.toLowerCase().includes(needle) || p.code.toLowerCase().includes(needle)) : [];
	const taskHits = needle ? tasks.filter((t) => t.name.toLowerCase().includes(needle)) : [];
	const dataHits = needle ? data.filter((d) => d.productCode.toLowerCase().includes(needle) || d.invoice.toLowerCase().includes(needle) || d.lot.toLowerCase().includes(needle)) : [];
	const goodsHits = needle ? goods.filter((d) => d.productCode.toLowerCase().includes(needle) || d.invoice.toLowerCase().includes(needle) || d.lot.toLowerCase().includes(needle)) : [];
	const lotHits = needle ? lots.filter((d) => d.lotCode.toLowerCase().includes(needle) || d.invoice.toLowerCase().includes(needle)) : [];
	const total = peopleHits.length + taskHits.length + dataHits.length + goodsHits.length + lotHits.length;
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "Tìm kiếm",
			subtitle: "Tên, mã NV, mã SP, invoice, lot, công việc"
		}),
		/* @__PURE__ */ jsx(Input, {
			autoFocus: true,
			value: q,
			onChange: (e) => setQ(e.target.value),
			placeholder: "Gõ để lọc…",
			className: "mb-4"
		}),
		!needle ? /* @__PURE__ */ jsx(EmptyState, {
			title: "Nhập từ khóa",
			hint: "Tìm nhanh trên toàn bộ dữ liệu đang lưu trên máy."
		}) : total === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "Không có kết quả" }) : /* @__PURE__ */ jsxs("ul", {
			className: "divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
			children: [
				peopleHits.map((p) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/people/$id",
					params: { id: p.id },
					className: "flex min-h-14 items-center justify-between px-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: p.name
					}), /* @__PURE__ */ jsx("p", {
						className: "font-mono text-xs text-muted",
						children: p.code
					})] }), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted",
						children: "Nhân sự"
					})]
				}) }, p.id)),
				taskHits.map((t) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/tasks/$id",
					params: { id: t.id },
					className: "flex min-h-14 items-center justify-between px-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: t.name
					}), /* @__PURE__ */ jsx("p", {
						className: "font-mono text-xs text-muted",
						children: t.status
					})] }), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted",
						children: "Việc"
					})]
				}) }, t.id)),
				dataHits.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/goods/data/$id",
					params: { id: d.id },
					className: "flex min-h-14 items-center justify-between px-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: d.productCode
					}), /* @__PURE__ */ jsx("p", {
						className: "font-mono text-xs text-muted",
						children: d.invoice
					})] }), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted",
						children: "DATA"
					})]
				}) }, d.id)),
				goodsHits.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/goods/export/$id",
					params: { id: d.id },
					className: "flex min-h-14 items-center justify-between px-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: d.productCode
					}), /* @__PURE__ */ jsx("p", {
						className: "font-mono text-xs text-muted",
						children: d.invoice
					})] }), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted",
						children: "Hàng"
					})]
				}) }, d.id)),
				lotHits.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
					to: "/goods/lot/$id",
					params: { id: d.id },
					className: "flex min-h-14 items-center justify-between px-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: d.lotCode
					}), /* @__PURE__ */ jsx("p", {
						className: "font-mono text-xs text-muted",
						children: d.invoice
					})] }), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted",
						children: "Lot"
					})]
				}) }, d.id))
			]
		})
	] });
}
//#endregion
export { SearchPage as component };
