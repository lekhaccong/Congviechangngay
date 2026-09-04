import { a as formatDateTime, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { i as Textarea, n as Input, t as Field } from "./input-D0c9ilIZ.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { a as openMail, i as missingGoodsMail, n as lotCloseMail, r as missingDataMail } from "./mail-kbJnmCg5.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/mail.tsx?tsr-split=component
function MailPage() {
	const userName = useAppStore((s) => s.currentUserName);
	const lots = useRows(() => getDb().lots.filter((l) => l.status === "CLOSED").toArray());
	const dataMissing = useRows(() => getDb().dataItems.filter((d) => d.status === "MISSING").toArray());
	const goodsMissing = useRows(() => getDb().goodsItems.filter((g) => g.status === "MISSING").toArray());
	const abs = useRows(() => getDb().abnormalities.filter((a) => a.status === "NEW" || a.status === "PROCESSING").toArray());
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: "Mail",
				subtitle: "Mở ứng dụng email trên máy, nội dung lấy từ dữ liệu ca"
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-sm font-medium text-muted",
						children: "Mẫu nhanh"
					}),
					lots.slice(0, 3).map((l) => /* @__PURE__ */ jsxs(Button, {
						variant: "secondary",
						className: "w-full justify-start",
						onClick: () => lotCloseMail({
							lotCode: l.lotCode,
							invoice: l.invoice,
							productCode: l.productCode,
							quantity: l.quantity,
							closer: userName,
							time: formatDateTime(Date.now()),
							status: "Đã chốt"
						}),
						children: ["Chốt Lot ", l.lotCode]
					}, l.id)),
					dataMissing.slice(0, 3).map((d) => /* @__PURE__ */ jsxs(Button, {
						variant: "secondary",
						className: "w-full justify-start",
						onClick: () => missingDataMail({
							productCode: d.productCode,
							invoice: d.invoice,
							note: d.note
						}),
						children: ["Thiếu DATA ", d.productCode]
					}, d.id)),
					goodsMissing.slice(0, 3).map((g) => /* @__PURE__ */ jsxs(Button, {
						variant: "secondary",
						className: "w-full justify-start",
						onClick: () => missingGoodsMail({
							productCode: g.productCode,
							invoice: g.invoice,
							lot: g.lot,
							note: g.note
						}),
						children: ["Hàng thiếu ", g.productCode]
					}, g.id)),
					abs.slice(0, 3).map((a) => /* @__PURE__ */ jsxs(Button, {
						variant: "secondary",
						className: "w-full justify-start",
						onClick: () => openMail(`[BẤT THƯỜNG] ${a.type}`, `${a.description}\nMức độ: ${a.severity}`),
						children: ["Bất thường: ", a.type]
					}, a.id))
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "Soạn mail"
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "Tiêu đề",
						children: /* @__PURE__ */ jsx(Input, {
							value: subject,
							onChange: (e) => setSubject(e.target.value)
						})
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "Nội dung",
						children: /* @__PURE__ */ jsx(Textarea, {
							value: body,
							onChange: (e) => setBody(e.target.value)
						})
					}),
					/* @__PURE__ */ jsx(Button, {
						className: "w-full",
						onClick: () => openMail(subject || "(Không tiêu đề)", body),
						children: "Mở ứng dụng mail"
					})
				]
			})
		]
	});
}
//#endregion
export { MailPage as component };
