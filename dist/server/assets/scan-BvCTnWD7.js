import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { I as upsertDataItem, R as upsertLot, s as createEmployee, x as lookupCode } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { n as Input } from "./input-D0c9ilIZ.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import jsQR from "jsqr";
//#region src/components/cvp/qr-scanner.tsx
function QrScanner({ onDetect, active }) {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const [error, setError] = useState(null);
	const last = useRef("");
	useEffect(() => {
		if (!active) return;
		let stream = null;
		let raf = 0;
		let stopped = false;
		async function start() {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: "environment" } },
					audio: false
				});
				const video = videoRef.current;
				if (!video) return;
				video.srcObject = stream;
				await video.play();
				const detector = "BarcodeDetector" in window ? new window.BarcodeDetector({ formats: [
					"qr_code",
					"code_128",
					"code_39",
					"ean_13",
					"ean_8",
					"upc_a"
				] }) : null;
				const tick = async () => {
					if (stopped) return;
					const v = videoRef.current;
					const c = canvasRef.current;
					if (v && v.readyState >= 2) try {
						if (detector) {
							const text = (await detector.detect(v))[0]?.rawValue;
							if (text && text !== last.current) {
								last.current = text;
								onDetect(text);
							}
						} else if (c) {
							c.width = v.videoWidth;
							c.height = v.videoHeight;
							const ctx = c.getContext("2d");
							if (ctx) {
								ctx.drawImage(v, 0, 0);
								const img = ctx.getImageData(0, 0, c.width, c.height);
								const code = jsQR(img.data, img.width, img.height);
								if (code?.data && code.data !== last.current) {
									last.current = code.data;
									onDetect(code.data);
								}
							}
						}
					} catch {}
					raf = requestAnimationFrame(() => void tick());
				};
				raf = requestAnimationFrame(() => void tick());
			} catch {
				setError("Không mở được camera. Cho phép quyền camera hoặc nhập mã thủ công.");
			}
		}
		start();
		return () => {
			stopped = true;
			cancelAnimationFrame(raf);
			stream?.getTracks().forEach((t) => t.stop());
		};
	}, [active, onDetect]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "relative overflow-hidden rounded-xl bg-surface-2 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsx("video", {
					ref: videoRef,
					className: "aspect-[3/4] w-full object-cover sm:aspect-video",
					playsInline: true,
					muted: true
				}), /* @__PURE__ */ jsx("div", {
					className: "pointer-events-none absolute inset-0 flex items-center justify-center",
					children: /* @__PURE__ */ jsx("div", { className: "h-48 w-48 rounded-lg border-2 border-primary/80" })
				})]
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				className: "hidden"
			}),
			error ? /* @__PURE__ */ jsx("p", {
				className: "text-sm text-danger",
				children: error
			}) : /* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted",
				children: "Đưa mã QR / barcode vào khung."
			}),
			/* @__PURE__ */ jsx(Button, {
				type: "button",
				variant: "ghost",
				size: "sm",
				onClick: () => {
					last.current = "";
				},
				children: "Quét tiếp"
			})
		]
	});
}
//#endregion
//#region src/routes/scan.tsx?tsr-split=component
function ScanPage() {
	const nav = useNavigate();
	const date = useAppStore((s) => s.selectedDate);
	const [manual, setManual] = useState("");
	const [unknown, setUnknown] = useState(null);
	const [active, setActive] = useState(true);
	const groups = useRows(() => getDb().groups.toArray());
	const shifts = useRows(() => getDb().shifts.toArray());
	const handle = useCallback(async (text) => {
		const hits = await lookupCode(text);
		if (hits.length === 1) {
			go(hits[0].module, hits[0].id, nav);
			return;
		}
		if (hits.length > 1) {
			go(hits[0].module, hits[0].id, nav);
			toast.message(`Có ${hits.length} kết quả, mở kết quả đầu`);
			return;
		}
		setUnknown(text);
		setActive(false);
	}, [nav]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: "Quét QR / Barcode",
				subtitle: "Camera thật — tìm nhân sự, DATA, hàng, Lot, invoice"
			}),
			/* @__PURE__ */ jsx(QrScanner, {
				active,
				onDetect: (t) => void handle(t)
			}),
			/* @__PURE__ */ jsxs("form", {
				className: "flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					handle(manual);
				},
				children: [/* @__PURE__ */ jsx(Input, {
					value: manual,
					onChange: (e) => setManual(e.target.value),
					placeholder: "Nhập mã nếu không quét được"
				}), /* @__PURE__ */ jsx(Button, {
					type: "submit",
					children: "Tìm"
				})]
			}),
			/* @__PURE__ */ jsxs(Dialog, {
				open: Boolean(unknown),
				onClose: () => {
					setUnknown(null);
					setActive(true);
				},
				title: "Chưa có dữ liệu",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "mb-3 text-sm",
					children: [
						"Mã ",
						/* @__PURE__ */ jsx("span", {
							className: "font-mono",
							children: unknown
						}),
						" chưa tồn tại. Tạo mới?"
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-1 gap-2",
					children: [
						/* @__PURE__ */ jsx(Button, {
							variant: "secondary",
							onClick: async () => {
								const row = await upsertDataItem({
									productCode: unknown ?? "",
									designCode: "",
									receivedAt: Date.now(),
									invoice: "",
									lot: "",
									quantity: 0,
									status: "NEW",
									note: "Tạo từ QR"
								});
								setUnknown(null);
								nav({
									to: "/goods/data/$id",
									params: { id: row.id }
								});
							},
							children: "Tạo DATA"
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "secondary",
							onClick: async () => {
								const row = await upsertLot({
									lotCode: unknown ?? "",
									invoice: "",
									productCode: "",
									date,
									quantity: 0,
									status: "OPEN"
								});
								setUnknown(null);
								nav({
									to: "/goods/lot/$id",
									params: { id: row.id }
								});
							},
							children: "Tạo Lot"
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "secondary",
							onClick: async () => {
								const row = await createEmployee({
									code: unknown ?? "",
									name: unknown ?? "Chưa đặt tên",
									serialNumber: "",
									groupId: groups[0]?.id ?? "",
									shiftId: shifts[0]?.id ?? "",
									status: "ACTIVE",
									role: "USER",
									note: "Tạo từ QR"
								});
								setUnknown(null);
								nav({
									to: "/people/$id",
									params: { id: row.id }
								});
							},
							children: "Tạo nhân sự"
						})
					]
				})]
			})
		]
	});
}
function go(module, id, nav) {
	if (module === "employees") nav({
		to: "/people/$id",
		params: { id }
	});
	else if (module === "dataItems") nav({
		to: "/goods/data/$id",
		params: { id }
	});
	else if (module === "goodsItems") nav({
		to: "/goods/export/$id",
		params: { id }
	});
	else if (module === "lots") nav({
		to: "/goods/lot/$id",
		params: { id }
	});
	else if (module === "tasks") nav({
		to: "/tasks/$id",
		params: { id }
	});
}
//#endregion
export { ScanPage as component };
