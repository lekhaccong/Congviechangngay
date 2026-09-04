import { h as getDb, t as useAppStore } from "./store-Crr6urgA.js";
import { H as nid, z as writeAudit } from "./repo-CgXr20UM.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { i as APP_NAME } from "./types-hR0syAmZ.js";
import { n as PageHeader } from "./page-header-BTcUZZCF.js";
import { t as can } from "./permissions-DI89eXWO.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import JSZip from "jszip";
//#region src/lib/cvp/backup.ts
var BACKUP_MODULES = [
	{
		key: "employees",
		label: "Nhân sự"
	},
	{
		key: "groups",
		label: "Nhóm"
	},
	{
		key: "shifts",
		label: "Ca"
	},
	{
		key: "attendance",
		label: "Chấm công"
	},
	{
		key: "workBlocks",
		label: "Khối công việc"
	},
	{
		key: "tasks",
		label: "Công việc"
	},
	{
		key: "checklists",
		label: "Checklist"
	},
	{
		key: "checklistItems",
		label: "Mục checklist"
	},
	{
		key: "overtimes",
		label: "OT"
	},
	{
		key: "amhs",
		label: "AMH"
	},
	{
		key: "dataItems",
		label: "DATA"
	},
	{
		key: "goodsItems",
		label: "Hàng xuất"
	},
	{
		key: "lots",
		label: "Lot"
	},
	{
		key: "lotClosures",
		label: "Chốt Lot"
	},
	{
		key: "threeS",
		label: "3S / 3D"
	},
	{
		key: "abnormalities",
		label: "Bất thường"
	},
	{
		key: "auditLogs",
		label: "Nhật ký"
	},
	{
		key: "handovers",
		label: "Bàn giao"
	},
	{
		key: "notifications",
		label: "Thông báo"
	},
	{
		key: "settings",
		label: "Cài đặt"
	},
	{
		key: "photos",
		label: "Ảnh (metadata)"
	},
	{
		key: "blobs",
		label: "Ảnh (file)"
	}
];
var TABLE_FILE = {
	employees: "employees.json",
	groups: "groups.json",
	shifts: "shifts.json",
	attendance: "attendance.json",
	workBlocks: "workBlocks.json",
	tasks: "tasks.json",
	checklists: "checklists.json",
	checklistItems: "checklistItems.json",
	photos: "photos.json",
	blobs: "blobs.json",
	auditLogs: "auditlog.json",
	overtimes: "ot.json",
	amhs: "amh.json",
	dataItems: "data.json",
	goodsItems: "goods.json",
	lots: "lots.json",
	lotClosures: "lotClosures.json",
	threeS: "threes.json",
	abnormalities: "abnormalities.json",
	notifications: "notifications.json",
	settings: "settings.json",
	handovers: "handovers.json"
};
async function sha256(text) {
	const buf = new TextEncoder().encode(text);
	const hash = await crypto.subtle.digest("SHA-256", buf);
	return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function tableOf(db, key) {
	return db[key];
}
async function exportBackup(modules) {
	const db = getDb();
	const zip = new JSZip();
	const payload = {};
	let imageCount = 0;
	for (const key of modules) {
		if (key === "blobs") continue;
		const rows = await tableOf(db, key).toArray();
		payload[key] = rows;
		zip.file(TABLE_FILE[key], JSON.stringify(rows));
	}
	if (modules.includes("blobs") || modules.includes("photos")) {
		const photos = modules.includes("photos") ? payload.photos ?? await db.photos.toArray() : await db.photos.toArray();
		const images = zip.folder("images");
		for (const p of photos) {
			const blobRow = await db.blobs.get(p.blobId);
			if (!blobRow) continue;
			const ext = blobRow.mime.includes("png") ? "png" : "jpg";
			images?.file(`${blobRow.id}.${ext}`, blobRow.data);
			imageCount += 1;
		}
	}
	const checksum = await sha256(JSON.stringify(payload));
	const manifest = {
		app: APP_NAME,
		backupVersion: 1,
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		databaseVersion: 1,
		imageCount,
		checksum,
		modules
	};
	zip.file("manifest.json", JSON.stringify(manifest, null, 2));
	zip.file("database.json", JSON.stringify({
		version: 1,
		modules
	}));
	await writeAudit({
		action: "BACKUP",
		module: "backup",
		recordId: "full",
		newValue: manifest
	});
	return zip.generateAsync({ type: "blob" });
}
async function parseBackup(file) {
	const zip = await JSZip.loadAsync(file);
	const manifestFile = zip.file("manifest.json");
	if (!manifestFile) return {
		manifest: emptyManifest(),
		counts: {},
		valid: false,
		error: "Thiếu manifest.json",
		zip
	};
	const manifest = JSON.parse(await manifestFile.async("string"));
	if (manifest.app !== "CongViecPro") return {
		manifest,
		counts: {},
		valid: false,
		error: "File không phải backup CongViecPro",
		zip
	};
	if (manifest.backupVersion > 1) return {
		manifest,
		counts: {},
		valid: false,
		error: "Phiên bản backup mới hơn app",
		zip
	};
	const counts = {};
	for (const key of manifest.modules ?? []) {
		const f = zip.file(TABLE_FILE[key]);
		if (!f) continue;
		try {
			const rows = JSON.parse(await f.async("string"));
			counts[key] = Array.isArray(rows) ? rows.length : 0;
		} catch {
			counts[key] = 0;
		}
	}
	return {
		manifest,
		counts,
		valid: true,
		zip
	};
}
async function restoreBackup(preview, mode, selected) {
	const db = getDb();
	const auto = await exportBackup(BACKUP_MODULES.map((m) => m.key));
	const autoName = `auto-before-restore-${Date.now()}`;
	await db.settings.put({
		key: `autobackup:${autoName}`,
		value: String(auto.size)
	});
	const autoBlobId = nid();
	await db.blobs.add({
		id: autoBlobId,
		mime: "application/zip",
		data: auto,
		createdAt: Date.now()
	});
	await db.settings.put({
		key: "lastAutoBackupBlobId",
		value: autoBlobId
	});
	await db.transaction("rw", db.tables, async () => {
		for (const key of selected) {
			if (key === "blobs") continue;
			const f = preview.zip.file(TABLE_FILE[key]);
			if (!f) continue;
			const rows = JSON.parse(await f.async("string"));
			const table = tableOf(db, key);
			if (mode === "overwrite") {
				await table.clear();
				if (rows.length) await table.bulkAdd(rows);
			} else if (mode === "skip") {
				const existing = new Set((await table.toArray()).map((r) => r.id));
				const fresh = rows.filter((r) => !existing.has(r.id));
				if (fresh.length) await table.bulkAdd(fresh);
			} else for (const row of rows) await table.put(row);
		}
	});
	if (selected.includes("blobs") || selected.includes("photos")) {
		const files = Object.keys(preview.zip.files).filter((n) => n.startsWith("images/") && !n.endsWith("/"));
		for (const name of files) {
			const f = preview.zip.file(name);
			if (!f) continue;
			const data = await f.async("blob");
			const id = name.split("/")[1]?.replace(/\.(jpg|jpeg|png|webp)$/i, "") ?? nid();
			const mime = name.endsWith(".png") ? "image/png" : "image/jpeg";
			const existing = await db.blobs.get(id);
			if (mode === "skip" && existing) continue;
			await db.blobs.put({
				id,
				mime,
				data,
				createdAt: Date.now()
			});
		}
	}
	await writeAudit({
		action: "RESTORE",
		module: "backup",
		recordId: preview.manifest.createdAt,
		newValue: {
			mode,
			selected,
			autoBackup: autoName
		}
	});
}
function emptyManifest() {
	return {
		app: APP_NAME,
		backupVersion: 1,
		createdAt: "",
		databaseVersion: 1,
		imageCount: 0,
		checksum: "",
		modules: []
	};
}
function backupFilename(date = /* @__PURE__ */ new Date()) {
	return `congviecpro_backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.zip`;
}
//#endregion
//#region src/routes/backup.tsx?tsr-split=component
function BackupPage() {
	const role = useAppStore((s) => s.role);
	const [selected, setSelected] = useState(BACKUP_MODULES.map((m) => m.key));
	const [preview, setPreview] = useState(null);
	const [mode, setMode] = useState("merge");
	const allowed = can(role, "backup");
	async function doExport() {
		const blob = await exportBackup(selected);
		const name = backupFilename();
		const file = new File([blob], name, { type: "application/zip" });
		if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({
			files: [file],
			title: name
		});
		else {
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = name;
			a.click();
		}
		toast.success("Đã tạo file backup");
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: "Backup",
				subtitle: "Database + ảnh + nhật ký, có version và checksum"
			}),
			!allowed ? /* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted",
				children: "Tài khoản hiện tại chỉ được xem, không xuất/nhập."
			}) : null,
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "mb-3 font-medium",
						children: "Chọn module"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mb-3 flex gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => setSelected(BACKUP_MODULES.map((m) => m.key)),
							children: "Tất cả"
						}), /* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setSelected([]),
							children: "Bỏ chọn"
						})]
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "grid grid-cols-2 gap-2",
						children: BACKUP_MODULES.map((m) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("label", {
							className: "flex min-h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								className: "size-4 accent-primary",
								checked: selected.includes(m.key),
								onChange: (e) => setSelected((cur) => e.target.checked ? [...cur, m.key] : cur.filter((k) => k !== m.key))
							}), m.label]
						}) }, m.key))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							disabled: !allowed,
							onClick: () => void doExport(),
							children: "Xuất & chia sẻ"
						}), /* @__PURE__ */ jsxs("label", {
							className: "inline-flex h-12 items-center justify-center rounded-md bg-surface-2 text-sm font-medium shadow-[var(--shadow-border)]",
							children: ["Nhập file", /* @__PURE__ */ jsx("input", {
								type: "file",
								accept: ".zip,application/zip",
								className: "hidden",
								disabled: !allowed,
								onChange: async (e) => {
									const file = e.target.files?.[0];
									e.target.value = "";
									if (!file) return;
									const p = await parseBackup(file);
									if (!p.valid) {
										toast.error(p.error ?? "File không hợp lệ");
										return;
									}
									setPreview(p);
								}
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted",
				children: "Trước khi restore, app tự tạo auto-backup. Chọn ghi đè / hợp nhất / bỏ qua trùng — không xóa thầm dữ liệu."
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: Boolean(preview),
				onClose: () => setPreview(null),
				title: "Xem trước restore",
				wide: true,
				children: preview ? /* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-sm text-muted",
							children: [
								"Tạo lúc ",
								preview.manifest.createdAt,
								" · version ",
								preview.manifest.backupVersion,
								" · ",
								preview.manifest.imageCount,
								" ảnh"
							]
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "max-h-48 space-y-1 overflow-y-auto text-sm",
							children: Object.entries(preview.counts).map(([k, n]) => /* @__PURE__ */ jsxs("li", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ jsx("span", { children: k }), /* @__PURE__ */ jsx("span", {
									className: "font-mono tabular-nums",
									children: n
								})]
							}, k))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								"overwrite",
								"merge",
								"skip"
							].map((m) => /* @__PURE__ */ jsx(Button, {
								size: "sm",
								variant: mode === m ? "default" : "secondary",
								onClick: () => setMode(m),
								children: m === "overwrite" ? "Ghi đè" : m === "merge" ? "Hợp nhất" : "Bỏ trùng"
							}, m))
						}),
						/* @__PURE__ */ jsx(Button, {
							className: "w-full",
							onClick: async () => {
								await restoreBackup(preview, mode, selected.length ? selected : preview.manifest.modules);
								toast.success("Đã restore. Auto-backup đã lưu.");
								setPreview(null);
							},
							children: "Xác nhận restore"
						})
					]
				}) : null
			})
		]
	});
}
//#endregion
export { BackupPage as component };
