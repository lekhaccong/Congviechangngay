import { h as getDb } from "./store-Crr6urgA.js";
import { O as savePhoto, y as deletePhoto } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { r as NativeSelect } from "./input-D0c9ilIZ.js";
import { f as PHOTO_KINDS } from "./types-hR0syAmZ.js";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Camera, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
//#region src/components/cvp/photo-strip.tsx
function PhotoStrip({ ownerModule, ownerId }) {
	const inputRef = useRef(null);
	const [kind, setKind] = useState(PHOTO_KINDS[0]);
	const photos = useRows(() => getDb().photos.where("ownerId").equals(ownerId).reverse().sortBy("createdAt"), [ownerId]);
	return /* @__PURE__ */ jsxs("section", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-sm font-medium text-muted",
					children: "Ảnh minh chứng"
				}), /* @__PURE__ */ jsx("span", {
					className: "font-mono text-xs tabular-nums text-muted",
					children: photos.length
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex gap-2",
				children: [
					/* @__PURE__ */ jsx(NativeSelect, {
						value: kind,
						onChange: (e) => setKind(e.target.value),
						className: "flex-1",
						children: PHOTO_KINDS.map((k) => /* @__PURE__ */ jsx("option", {
							value: k,
							children: k
						}, k))
					}),
					/* @__PURE__ */ jsxs(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => inputRef.current?.click(),
						children: [/* @__PURE__ */ jsx(Camera, { className: "size-4" }), "Chụp"]
					}),
					/* @__PURE__ */ jsx("input", {
						ref: inputRef,
						type: "file",
						accept: "image/*",
						capture: "environment",
						className: "hidden",
						onChange: async (e) => {
							const file = e.target.files?.[0];
							e.target.value = "";
							if (!file) return;
							await savePhoto({
								ownerModule,
								ownerId,
								kind,
								blob: file
							});
							toast.success("Đã lưu ảnh");
						}
					})
				]
			}),
			photos.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted",
				children: "Chưa có ảnh. Chụp để lưu minh chứng."
			}) : /* @__PURE__ */ jsx("ul", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
				children: photos.map((p) => /* @__PURE__ */ jsx(PhotoCard, {
					photoId: p.id,
					blobId: p.blobId,
					kind: p.kind,
					createdAt: p.createdAt
				}, p.id))
			})
		]
	});
}
function PhotoCard({ photoId, blobId, kind, createdAt }) {
	const [url, setUrl] = useState(null);
	useEffect(() => {
		let revoke = null;
		getDb().blobs.get(blobId).then((row) => {
			if (!row) return;
			revoke = URL.createObjectURL(row.data);
			setUrl(revoke);
		});
		return () => {
			if (revoke) URL.revokeObjectURL(revoke);
		};
	}, [blobId]);
	return /* @__PURE__ */ jsxs("li", {
		className: "overflow-hidden rounded-lg bg-surface-2 shadow-[var(--shadow-border)]",
		children: [url ? /* @__PURE__ */ jsx("img", {
			src: url,
			alt: kind,
			className: "aspect-[4/3] w-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
		}) : /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] bg-surface" }), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between gap-1 px-2 py-1.5",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ jsx("p", {
					className: "truncate text-xs",
					children: kind
				}), /* @__PURE__ */ jsx("p", {
					className: "font-mono text-[10px] text-muted tabular-nums",
					children: new Date(createdAt).toLocaleString("vi-VN")
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex",
				children: [/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-9 min-h-9",
					"aria-label": "Chia sẻ",
					onClick: async () => {
						const row = await getDb().blobs.get(blobId);
						if (!row) return;
						const file = new File([row.data], `${kind}.jpg`, { type: row.mime });
						if (navigator.share) await navigator.share({
							files: [file],
							title: kind
						});
						else {
							const a = document.createElement("a");
							a.href = URL.createObjectURL(row.data);
							a.download = file.name;
							a.click();
						}
					},
					children: /* @__PURE__ */ jsx(Share2, { className: "size-4" })
				}), /* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-9 min-h-9",
					"aria-label": "Xóa ảnh",
					onClick: async () => {
						await deletePhoto(photoId);
						toast.success("Đã xóa ảnh");
					},
					children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
				})]
			})]
		})]
	});
}
//#endregion
export { PhotoStrip as t };
