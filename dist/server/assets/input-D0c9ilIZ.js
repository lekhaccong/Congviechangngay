import { t as cn } from "./utils-C_uf36nf.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/ui/input.tsx
function Input({ className, ...props }) {
	return /* @__PURE__ */ jsx("input", {
		className: cn("flex h-12 w-full rounded-md bg-surface-2 px-3 text-base text-fg shadow-[var(--shadow-border)] placeholder:text-muted disabled:opacity-50", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ jsx("textarea", {
		className: cn("flex min-h-24 w-full rounded-md bg-surface-2 px-3 py-3 text-base text-fg shadow-[var(--shadow-border)] placeholder:text-muted", className),
		...props
	});
}
function NativeSelect({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("select", {
		className: cn("flex h-12 w-full rounded-md bg-surface-2 px-3 text-base text-fg shadow-[var(--shadow-border)]", className),
		...props,
		children
	});
}
function Field({ label, children, hint }) {
	return /* @__PURE__ */ jsxs("label", {
		className: "flex flex-col gap-1.5",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "text-sm font-medium text-muted",
				children: label
			}),
			children,
			hint ? /* @__PURE__ */ jsx("span", {
				className: "text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { Textarea as i, Input as n, NativeSelect as r, Field as t };
