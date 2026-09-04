import { jsx } from "react/jsx-runtime";
//#region src/components/cvp/filter-chip.tsx
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		className: `h-10 shrink-0 rounded-full px-3 text-sm ${active ? "bg-primary text-primary-foreground" : "bg-surface-2 text-fg"}`,
		children
	});
}
//#endregion
export { FilterChip as t };
