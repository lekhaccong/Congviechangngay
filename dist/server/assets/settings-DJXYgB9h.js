import { g as resetDatabase, h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { C as persistSetting } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { r as NativeSelect, t as Field } from "./input-D0c9ilIZ.js";
import { a as APP_VERSION, p as ROLE_LABEL } from "./types-hR0syAmZ.js";
import { d as wipeSample, f as requestNotifyPermission, l as applyCurrentUser, u as applyShift } from "./router-P_EsKByB.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/settings.tsx?tsr-split=component
function SettingsPage() {
	const store = useAppStore();
	const people = useRows(() => getDb().employees.toArray());
	const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: "Cài đặt",
				subtitle: `CongViecPro ${APP_VERSION}`
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "Người đang thao tác"
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "Tài khoản trên máy này",
						children: /* @__PURE__ */ jsxs(NativeSelect, {
							value: store.currentUserId ?? "",
							onChange: (e) => void applyCurrentUser(e.target.value || null),
							children: [/* @__PURE__ */ jsx("option", {
								value: "",
								children: "Hệ thống"
							}), people.map((p) => /* @__PURE__ */ jsxs("option", {
								value: p.id,
								children: [
									p.name,
									" · ",
									ROLE_LABEL[p.role]
								]
							}, p.id))]
						})
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-muted",
						children: [
							"Quyền hiện tại: ",
							ROLE_LABEL[store.role],
							". ADMIN toàn quyền, LEADER quản lý ca, USER thực hiện, VIEWER chỉ xem."
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "Ca & OT"
					}),
					/* @__PURE__ */ jsxs("label", {
						className: "flex min-h-12 items-center gap-3",
						children: [/* @__PURE__ */ jsx("input", {
							type: "checkbox",
							className: "size-5 accent-primary",
							checked: store.autoShift,
							onChange: (e) => void applyShift(store.selectedShiftId, e.target.checked)
						}), "Tự chọn ca theo giờ máy"]
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "Làm tròn OT (phút)",
						children: /* @__PURE__ */ jsx(NativeSelect, {
							value: String(store.otRoundMinutes),
							onChange: (e) => {
								const n = Number(e.target.value);
								store.setOtRound(n);
								persistSetting("otRoundMinutes", String(n));
							},
							children: [
								15,
								30,
								60
							].map((n) => /* @__PURE__ */ jsxs("option", {
								value: n,
								children: [n, " phút"]
							}, n))
						})
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted",
						children: "Ca 4 22:00–06:00 qua ngày. OT 22:00→01:00 = 3 giờ."
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "text-sm text-muted",
						children: shifts.map((s) => /* @__PURE__ */ jsxs("li", { children: [
							s.name,
							": ",
							s.startTime,
							"–",
							s.endTime,
							s.crossesMidnight ? " (qua ngày)" : ""
						] }, s.id))
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "Nhắc việc"
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "secondary",
						className: "w-full",
						onClick: async () => {
							const ok = await requestNotifyPermission();
							toast[ok ? "success" : "error"](ok ? "Đã bật thông báo" : "Chưa cấp quyền thông báo");
						},
						children: "Bật thông báo trình duyệt"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted",
						children: "Nhắc việc đến hạn, DATA thiếu, lot chưa chốt — chạy cả khi đang ở màn khác."
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "Dữ liệu"
					}),
					store.sampleData ? /* @__PURE__ */ jsx(Button, {
						variant: "secondary",
						className: "w-full",
						onClick: async () => {
							if (!confirm("Xóa toàn bộ dữ liệu mẫu? Dữ liệu bạn tự nhập sẽ giữ lại nếu không gắn cờ mẫu.")) return;
							await wipeSample();
							toast.success("Đã xóa dữ liệu mẫu");
						},
						children: "Xóa dữ liệu mẫu"
					}) : /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: "Không còn dữ liệu mẫu."
					}),
					can(store.role, "settings") ? /* @__PURE__ */ jsx(Button, {
						variant: "danger",
						className: "w-full",
						onClick: async () => {
							if (!confirm("Xóa toàn bộ dữ liệu trên máy này và tạo lại kho trống?")) return;
							await resetDatabase();
							window.location.reload();
						},
						children: "Reset ứng dụng"
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-medium",
						children: "File APK Android"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-sm text-muted",
						children: [
							"Đẩy project lên GitHub, vào tab Actions, chạy workflow ",
							/* @__PURE__ */ jsx("span", {
								className: "text-fg",
								children: "Build APK"
							}),
							", rồi tải artifact ",
							/* @__PURE__ */ jsx("span", {
								className: "font-mono text-fg",
								children: "CongViecPro.apk"
							}),
							". Cài trên điện thoại (cho phép cài từ nguồn không xác định). App chạy offline, dữ liệu lưu trên máy."
						]
					}),
					/* @__PURE__ */ jsxs("ol", {
						className: "list-decimal space-y-1 pl-5 text-sm text-muted",
						children: [
							/* @__PURE__ */ jsx("li", { children: "GitHub → tab Actions → Build APK → Run workflow" }),
							/* @__PURE__ */ jsx("li", { children: "Mở job xong → Artifacts → CongViecPro-apk" }),
							/* @__PURE__ */ jsx("li", { children: "Giải nén zip, cài file .apk trên Android" })
						]
					})
				]
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
