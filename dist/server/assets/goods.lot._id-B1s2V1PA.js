import { a as formatDateTime, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { R as upsertLot, r as closeLot } from "./repo-CgXr20UM.js";
import { n as useRows, t as useRow } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { i as Textarea, r as NativeSelect, t as Field } from "./input-D0c9ilIZ.js";
import { u as LOT_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { n as Route } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { s as LotBadge } from "./status-badge-DvBF2MJq.js";
import { t as PhotoStrip } from "./photo-strip-ByIBfJVk.js";
import { n as lotCloseMail } from "./mail-kbJnmCg5.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/goods.lot.$id.tsx?tsr-split=component
function LotDetail() {
	const { id } = Route.useParams();
	const userName = useAppStore((s) => s.currentUserName);
	const lot = useRow(() => getDb().lots.get(id), [id]);
	const closures = useRows(() => getDb().lotClosures.where("lotId").equals(id).toArray(), [id]);
	const people = useRows(() => getDb().employees.toArray());
	const [note, setNote] = useState("");
	if (!lot) return /* @__PURE__ */ jsx("p", {
		className: "text-muted",
		children: "Không tìm thấy Lot."
	});
	const closed = lot.status === "CLOSED";
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: lot.lotCode,
				subtitle: lot.invoice,
				back: "/goods",
				action: /* @__PURE__ */ jsx(LotBadge, { status: lot.status })
			}),
			/* @__PURE__ */ jsxs("dl", {
				className: "grid grid-cols-2 gap-3 rounded-xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Mã SP"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono",
						children: lot.productCode
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Số lượng"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-mono tabular-nums",
						children: lot.quantity
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "text-xs text-muted",
						children: "Ngày"
					}), /* @__PURE__ */ jsx("dd", { children: lot.date })] })
				]
			}),
			!closed ? /* @__PURE__ */ jsx(NativeSelect, {
				value: lot.status,
				onChange: (e) => {
					const status = e.target.value;
					if (status === "CLOSED") return;
					upsertLot({
						...lot,
						status,
						id: lot.id
					});
				},
				children: [
					"OPEN",
					"PROCESSING",
					"ENOUGH"
				].map((s) => /* @__PURE__ */ jsx("option", {
					value: s,
					children: LOT_STATUS_LABEL[s]
				}, s))
			}) : null,
			/* @__PURE__ */ jsx(PhotoStrip, {
				ownerModule: "lots",
				ownerId: id
			}),
			!closed ? /* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "Chốt Lot"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Ghi người thực hiện, thời gian, ghi chú. Không xóa được lịch sử chốt."
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "Ghi chú chốt",
						children: /* @__PURE__ */ jsx(Textarea, {
							value: note,
							onChange: (e) => setNote(e.target.value)
						})
					}),
					/* @__PURE__ */ jsx(Button, {
						className: "w-full",
						onClick: async () => {
							try {
								await closeLot(id, note, null);
								toast.success("Đã chốt Lot");
							} catch (e) {
								toast.error(e instanceof Error ? e.message : "Không chốt được");
							}
						},
						children: "Xác nhận chốt"
					})
				]
			}) : /* @__PURE__ */ jsxs("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-2 font-medium",
					children: "Lịch sử chốt"
				}), closures.map((c) => {
					const who = people.find((p) => p.id === c.closedBy);
					return /* @__PURE__ */ jsxs("div", {
						className: "text-sm",
						children: [
							/* @__PURE__ */ jsxs("p", { children: [
								who?.name ?? c.closedBy,
								" · ",
								formatDateTime(c.closedAt)
							] }),
							/* @__PURE__ */ jsx("p", {
								className: "text-muted",
								children: c.note || "Không ghi chú"
							}),
							/* @__PURE__ */ jsx(Button, {
								className: "mt-3 w-full",
								variant: "secondary",
								onClick: () => lotCloseMail({
									lotCode: lot.lotCode,
									invoice: lot.invoice,
									productCode: lot.productCode,
									quantity: lot.quantity,
									closer: who?.name ?? userName,
									time: formatDateTime(c.closedAt),
									status: "Đã chốt",
									note: c.note
								}),
								children: "Gửi mail chốt Lot"
							})
						]
					}, c.id);
				})]
			})
		]
	});
}
//#endregion
export { LotDetail as component };
