import { h as getDb } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { m as SEVERITY_LABEL } from "./types-hR0syAmZ.js";
import { c as AbnormalDialog } from "./router-P_EsKByB.js";
import { n as PageHeader, t as EmptyState } from "./page-header-BTcUZZCF.js";
import { t as AbnormalBadge } from "./status-badge-DvBF2MJq.js";
import { t as FilterChip } from "./filter-chip-TMIIHD5x.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/abnormal.index.tsx?tsr-split=component
function AbnormalPage() {
	const rows = useRows(() => getDb().abnormalities.reverse().sortBy("detectedAt"));
	const people = useRows(() => getDb().employees.toArray());
	const [open, setOpen] = useState(false);
	const [filter, setFilter] = useState("all");
	const shown = rows.filter((r) => filter === "all" || r.status === filter);
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			title: "Bất thường",
			subtitle: "Ghi nhận từ mọi module",
			action: /* @__PURE__ */ jsx(Button, {
				size: "sm",
				onClick: () => setOpen(true),
				children: "Báo cáo"
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-3 flex gap-2 overflow-x-auto",
			children: [
				"all",
				"NEW",
				"PROCESSING",
				"RESOLVED",
				"CLOSED"
			].map((f) => /* @__PURE__ */ jsx(FilterChip, {
				active: filter === f,
				onClick: () => setFilter(f),
				children: f === "all" ? "Tất cả" : f === "NEW" ? "Mới" : f === "PROCESSING" ? "Đang xử lý" : f === "RESOLVED" ? "Đã xử lý" : "Đóng"
			}, f))
		}),
		shown.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "Không có bất thường" }) : /* @__PURE__ */ jsx("ul", {
			className: "space-y-2",
			children: shown.map((a) => {
				const who = people.find((p) => p.id === a.detectedBy);
				return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
					to: "/abnormal/$id",
					params: { id: a.id },
					className: "block rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("p", {
								className: "font-medium",
								children: a.type
							}),
							/* @__PURE__ */ jsx("p", {
								className: "line-clamp-2 text-sm text-muted",
								children: a.description
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-1 text-xs text-muted",
								children: [
									who?.name,
									" · ",
									SEVERITY_LABEL[a.severity]
								]
							})
						] }), /* @__PURE__ */ jsx(AbnormalBadge, { status: a.status })]
					})
				}) }, a.id);
			})
		}),
		/* @__PURE__ */ jsx(AbnormalDialog, {
			open,
			onClose: () => setOpen(false)
		})
	] });
}
//#endregion
export { AbnormalPage as component };
