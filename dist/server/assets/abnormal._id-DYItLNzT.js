import { a as formatDateTime, h as getDb } from "./store-Crr6urgA.js";
import { j as updateAbnormal } from "./repo-CgXr20UM.js";
import { n as useRows, t as useRow } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { i as Textarea, r as NativeSelect } from "./input-D0c9ilIZ.js";
import { m as SEVERITY_LABEL, t as ABNORMAL_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { s as Route } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { t as AbnormalBadge } from "./status-badge-DvBF2MJq.js";
import { t as PhotoStrip } from "./photo-strip-ByIBfJVk.js";
import { t as abnormalMail } from "./mail-kbJnmCg5.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/abnormal.$id.tsx?tsr-split=component
function AbnormalDetail() {
	const { id } = Route.useParams();
	const item = useRow(() => getDb().abnormalities.get(id), [id]);
	const people = useRows(() => getDb().employees.toArray());
	if (!item) return /* @__PURE__ */ jsx("p", {
		className: "text-muted",
		children: "Không tìm thấy."
	});
	const detector = people.find((p) => p.id === item.detectedBy);
	const handler = people.find((p) => p.id === item.handlerId);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: item.type,
				back: "/abnormal",
				action: /* @__PURE__ */ jsx(AbnormalBadge, { status: item.status })
			}),
			/* @__PURE__ */ jsx("p", { children: item.description }),
			/* @__PURE__ */ jsxs("p", {
				className: "text-sm text-muted",
				children: [
					SEVERITY_LABEL[item.severity],
					" · ",
					detector?.name,
					" · ",
					formatDateTime(item.detectedAt),
					handler ? ` · xử lý: ${handler.name}` : ""
				]
			}),
			/* @__PURE__ */ jsx(NativeSelect, {
				value: item.status,
				onChange: (e) => void updateAbnormal(id, { status: e.target.value }),
				children: Object.keys(ABNORMAL_STATUS_LABEL).map((s) => /* @__PURE__ */ jsx("option", {
					value: s,
					children: ABNORMAL_STATUS_LABEL[s]
				}, s))
			}),
			/* @__PURE__ */ jsx(Textarea, {
				defaultValue: item.description,
				onBlur: (e) => {
					if (e.target.value !== item.description) updateAbnormal(id, { description: e.target.value });
				}
			}),
			/* @__PURE__ */ jsx(PhotoStrip, {
				ownerModule: "abnormalities",
				ownerId: id
			}),
			/* @__PURE__ */ jsx(Button, {
				className: "w-full",
				variant: "secondary",
				onClick: () => abnormalMail({
					type: item.type,
					description: item.description,
					severity: SEVERITY_LABEL[item.severity],
					detector: detector?.name ?? "",
					time: formatDateTime(item.detectedAt)
				}),
				children: "Gửi mail bất thường"
			})
		]
	});
}
//#endregion
export { AbnormalDetail as component };
