import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ChevronLeft } from "lucide-react";
//#region src/components/cvp/page-header.tsx
function PageHeader({ title, subtitle, back, action }) {
	return /* @__PURE__ */ jsxs("header", {
		className: "mb-4 flex items-start justify-between gap-3",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "min-w-0",
			children: [
				back ? /* @__PURE__ */ jsxs(Link, {
					to: back,
					className: "mb-1 inline-flex min-h-10 items-center gap-1 text-sm text-muted",
					children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "size-4" }), "Quay lại"]
				}) : null,
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: title
				}),
				subtitle ? /* @__PURE__ */ jsx("p", {
					className: "mt-0.5 text-sm text-muted",
					children: subtitle
				}) : null
			]
		}), action ? /* @__PURE__ */ jsx("div", {
			className: "shrink-0",
			children: action
		}) : null]
	});
}
function EmptyState({ title, hint }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl bg-surface px-4 py-10 text-center shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ jsx("p", {
			className: "font-medium",
			children: title
		}), hint ? /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted",
			children: hint
		}) : null]
	});
}
function Stat({ label, value, hint, tone }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "min-w-0",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs font-medium uppercase tracking-wide text-muted",
				children: label
			}),
			/* @__PURE__ */ jsx("p", {
				className: `mt-1 font-mono text-2xl tabular-nums ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : tone === "info" ? "text-info" : "text-fg"}`,
				children: value
			}),
			hint ? /* @__PURE__ */ jsx("p", {
				className: "mt-0.5 text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { PageHeader as n, Stat as r, EmptyState as t };
