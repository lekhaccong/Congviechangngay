import { t as cn } from "./utils-C_uf36nf.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { useEffect } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
//#region src/components/ui/dialog.tsx
function Dialog({ open, onClose, title, children, wide }) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	if (!open) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "absolute inset-0 bg-bg/70",
			"aria-label": "Đóng",
			onClick: onClose
		}), /* @__PURE__ */ jsxs("div", {
			className: cn("relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:rounded-xl", wide ? "sm:max-w-lg" : "sm:max-w-md"),
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "dialog-title",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "mb-4 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsx("h2", {
					id: "dialog-title",
					className: "text-lg font-semibold",
					children: title
				}), /* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-10 min-h-10",
					onClick: onClose,
					"aria-label": "Đóng",
					children: /* @__PURE__ */ jsx(X, { className: "size-5" })
				})]
			}), children]
		})]
	});
}
//#endregion
export { Dialog as t };
