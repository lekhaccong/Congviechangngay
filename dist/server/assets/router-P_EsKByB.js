import { t as cn } from "./utils-C_uf36nf.js";
import { h as getDb, i as formatDate, l as getActiveContext, m as canUseDb, n as addDays, o as formatDateVi, t as useAppStore } from "./store-Crr6urgA.js";
import { C as persistSetting, H as nid, i as createAbnormal, w as refreshOverdueTasks } from "./repo-CgXr20UM.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { i as Textarea, n as Input, r as NativeSelect, t as Field } from "./input-D0c9ilIZ.js";
import { n as ABNORMAL_TYPES } from "./types-hR0syAmZ.js";
import { useEffect, useState } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent, useRouter, useRouterState } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ClipboardList, LayoutDashboard, MoreHorizontal, Package, QrCode, Search, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { Toaster, toast } from "sonner";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/lib/error-component.tsx
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ jsxs("main", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "text-lg font-semibold",
				children: "Có lỗi xảy ra"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: error.message || "Thử tải lại trang."
			})
		]
	});
}
//#endregion
//#region src/lib/auth/provider.tsx
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ jsx(Fragment, { children });
}
//#endregion
//#region src/lib/preview-embedder-origin.ts
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
//#endregion
//#region src/lib/preview-host-bridge.ts
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = z.object({
	channel: z.literal(PREVIEW_BRIDGE_CHANNEL),
	version: z.number().int().positive(),
	type: z.string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: z.literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: z.literal("navigate"),
	path: z.string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: z.literal("history"),
	delta: z.union([z.literal(-1), z.literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
//#endregion
//#region src/components/preview-host-bridge.tsx
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	useEffect(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
//#endregion
//#region src/lib/cvp/seed.ts
var SHIFT_DEFS = [
	{
		name: "Ca 1",
		startTime: "06:00",
		endTime: "14:00",
		crossesMidnight: false,
		order: 1
	},
	{
		name: "Ca 2",
		startTime: "08:00",
		endTime: "17:00",
		crossesMidnight: false,
		order: 2
	},
	{
		name: "Ca 3",
		startTime: "14:00",
		endTime: "22:00",
		crossesMidnight: false,
		order: 3
	},
	{
		name: "Ca 4",
		startTime: "22:00",
		endTime: "06:00",
		crossesMidnight: true,
		order: 4
	}
];
var BLOCK_NAMES = [
	"DATA",
	"Hàng xuất",
	"Chốt Lot",
	"AMH",
	"3S / 3D",
	"Kiểm kê",
	"Mail"
];
var CHECKLIST_BY_BLOCK = {
	DATA: [
		"Kiểm tra DATA",
		"Đối chiếu invoice",
		"Xác nhận số lượng"
	],
	"Hàng xuất": [
		"Kiểm tra hàng xuất",
		"Kiểm tra hàng thiếu",
		"Đóng gói"
	],
	"Chốt Lot": [
		"Kiểm tra Lot",
		"Đối chiếu DATA",
		"Xác nhận người chốt"
	],
	AMH: ["Khai báo AMH", "Đối chiếu giờ OT"],
	"3S / 3D": [
		"Sàng lọc",
		"Sắp xếp",
		"Sạch sẽ",
		"Săn sóc / Duy trì",
		"Sẵn sàng / Kỷ luật",
		"3D"
	],
	"Kiểm kê": ["Đếm tồn", "Đối chiếu hệ thống"],
	Mail: ["Soạn mail chốt Lot", "Gửi báo cáo ca"]
};
async function seedCatalog(db) {
	const shifts = SHIFT_DEFS.map((s, i) => ({
		...s,
		id: `shift-${i + 1}`
	}));
	const groups = [{
		id: "group-1",
		name: "Nhóm 1",
		order: 1
	}, {
		id: "group-2",
		name: "Nhóm 2",
		order: 2
	}];
	const blocks = BLOCK_NAMES.map((name, i) => ({
		id: `block-${i + 1}`,
		name,
		order: i + 1
	}));
	const checklists = [];
	const items = [];
	for (const block of blocks) {
		const cl = {
			id: `cl-${block.id}`,
			blockId: block.id,
			name: `Checklist ${block.name}`
		};
		checklists.push(cl);
		(CHECKLIST_BY_BLOCK[block.name] ?? []).forEach((label, idx) => {
			items.push({
				id: nid(),
				checklistId: cl.id,
				taskId: null,
				threeSId: null,
				label,
				done: false,
				completedAt: null,
				completedBy: null,
				photoId: null,
				note: "",
				order: idx + 1
			});
		});
	}
	await db.shifts.bulkAdd(shifts);
	await db.groups.bulkAdd(groups);
	await db.workBlocks.bulkAdd(blocks);
	await db.checklists.bulkAdd(checklists);
	await db.checklistItems.bulkAdd(items);
	return {
		shifts,
		groups,
		blocks
	};
}
async function seedSampleData(db) {
	const now = Date.now();
	const today = formatDate(/* @__PURE__ */ new Date());
	const shifts = await db.shifts.orderBy("order").toArray();
	const groups = await db.groups.orderBy("order").toArray();
	const blocks = await db.workBlocks.orderBy("order").toArray();
	const ca1 = shifts.find((s) => s.order === 1)?.id ?? "shift-1";
	const ca2 = shifts.find((s) => s.order === 2)?.id ?? "shift-2";
	const ca3 = shifts.find((s) => s.order === 3)?.id ?? "shift-3";
	const ca4 = shifts.find((s) => s.order === 4)?.id ?? "shift-4";
	const g1 = groups[0]?.id ?? "group-1";
	const g2 = groups[1]?.id ?? "group-2";
	const employees = [
		{
			code: "NV001",
			name: "Nguyễn Văn An",
			serialNumber: "01",
			groupId: g1,
			shiftId: ca1,
			status: "ACTIVE",
			role: "ADMIN",
			note: "Tổ trưởng ca 1"
		},
		{
			code: "NV002",
			name: "Trần Thị Bình",
			serialNumber: "02",
			groupId: g1,
			shiftId: ca1,
			status: "ACTIVE",
			role: "LEADER",
			note: ""
		},
		{
			code: "NV003",
			name: "Lê Văn Cường",
			serialNumber: "03",
			groupId: g1,
			shiftId: ca1,
			status: "ACTIVE",
			role: "USER",
			note: ""
		},
		{
			code: "NV004",
			name: "Phạm Thị Dung",
			serialNumber: "04",
			groupId: g1,
			shiftId: ca1,
			status: "ACTIVE",
			role: "USER",
			note: ""
		},
		{
			code: "NV005",
			name: "Hoàng Văn Em",
			serialNumber: "05",
			groupId: g2,
			shiftId: ca1,
			status: "ACTIVE",
			role: "USER",
			note: ""
		},
		{
			code: "NV006",
			name: "Võ Thị Phương",
			serialNumber: "06",
			groupId: g2,
			shiftId: ca1,
			status: "ACTIVE",
			role: "USER",
			note: ""
		},
		{
			code: "NV007",
			name: "Đặng Văn Giang",
			serialNumber: "07",
			groupId: g2,
			shiftId: ca3,
			status: "ACTIVE",
			role: "USER",
			note: "Ca chiều"
		},
		{
			code: "NV008",
			name: "Bùi Thị Hoa",
			serialNumber: "08",
			groupId: g1,
			shiftId: ca2,
			status: "ACTIVE",
			role: "USER",
			note: ""
		},
		{
			code: "NV009",
			name: "Ngô Văn Ích",
			serialNumber: "09",
			groupId: g2,
			shiftId: ca4,
			status: "ACTIVE",
			role: "USER",
			note: "Ca đêm"
		},
		{
			code: "NV010",
			name: "Lý Thị Kim",
			serialNumber: "10",
			groupId: g1,
			shiftId: ca2,
			status: "LEAVE",
			role: "VIEWER",
			note: "Nghỉ phép"
		}
	].map((p) => ({
		...p,
		id: nid(),
		sample: true,
		createdAt: now,
		updatedAt: now
	}));
	await db.employees.bulkAdd(employees);
	const byCode = (code) => employees.find((e) => e.code === code);
	const an = byCode("NV001");
	const binh = byCode("NV002");
	const cuong = byCode("NV003");
	const dung = byCode("NV004");
	const em = byCode("NV005");
	const attendance = employees.filter((e) => e.shiftId === ca1 && e.status === "ACTIVE").map((e, i) => {
		const late = i === 5;
		const checkIn = now - 108e5 + (late ? 12e5 : 0);
		return {
			id: nid(),
			employeeId: e.id,
			date: today,
			shiftId: ca1,
			checkIn,
			checkOut: null,
			status: late ? "LATE" : "CHECKED_IN",
			otMinutes: 0,
			note: late ? "Vào muộn 20 phút" : "",
			sample: true,
			createdAt: now
		};
	});
	attendance.pop();
	attendance.pop();
	await db.attendance.bulkAdd(attendance);
	const dataBlock = blocks.find((b) => b.name === "DATA");
	const hangBlock = blocks.find((b) => b.name === "Hàng xuất");
	const lotBlock = blocks.find((b) => b.name === "Chốt Lot");
	const amhBlock = blocks.find((b) => b.name === "AMH");
	const s3Block = blocks.find((b) => b.name === "3S / 3D");
	const tasks = [
		{
			id: nid(),
			name: "Nhận DATA SP001",
			blockId: dataBlock.id,
			assigneeId: cuong.id,
			date: today,
			shiftId: ca1,
			estimatedMinutes: 30,
			deadline: now + 24e5,
			reminderTime: now + 6e5,
			status: "COMPLETED",
			progress: 100,
			note: "Đã nhận đủ",
			sample: true,
			createdAt: now - 144e5,
			updatedAt: now - 108e5,
			completedAt: now - 108e5
		},
		{
			id: nid(),
			name: "Kiểm tra hàng xuất INV-260901-01",
			blockId: hangBlock.id,
			assigneeId: dung.id,
			date: today,
			shiftId: ca1,
			estimatedMinutes: 45,
			deadline: now + 54e5,
			reminderTime: now + 18e5,
			status: "IN_PROGRESS",
			progress: 50,
			note: "",
			sample: true,
			createdAt: now - 72e5,
			updatedAt: now - 18e5,
			completedAt: null
		},
		{
			id: nid(),
			name: "Chốt Lot LOT-260901-08",
			blockId: lotBlock.id,
			assigneeId: binh.id,
			date: today,
			shiftId: ca1,
			estimatedMinutes: 20,
			deadline: now + 72e5,
			reminderTime: now + 54e5,
			status: "TODO",
			progress: 0,
			note: "",
			sample: true,
			createdAt: now - 36e5,
			updatedAt: now - 36e5,
			completedAt: null
		},
		{
			id: nid(),
			name: "Khai AMH cuối ca",
			blockId: amhBlock.id,
			assigneeId: an.id,
			date: today,
			shiftId: ca1,
			estimatedMinutes: 15,
			deadline: now + 18e6,
			reminderTime: now + 144e5,
			status: "TODO",
			progress: 0,
			note: "",
			sample: true,
			createdAt: now,
			updatedAt: now,
			completedAt: null
		},
		{
			id: nid(),
			name: "3S khu đóng gói",
			blockId: s3Block.id,
			assigneeId: em.id,
			date: today,
			shiftId: ca1,
			estimatedMinutes: 25,
			deadline: now - 12e5,
			reminderTime: now - 24e5,
			status: "OVERDUE",
			progress: 25,
			note: "Chưa xong góc kệ B",
			sample: true,
			createdAt: now - 18e6,
			updatedAt: now - 36e5,
			completedAt: null
		}
	];
	await db.tasks.bulkAdd(tasks);
	const dataItems = [
		{
			id: nid(),
			productCode: "SP-001",
			designCode: "TK-A12",
			receivedAt: now - 18e6,
			invoice: "INV-260901-01",
			lot: "LOT-260901-08",
			quantity: 1200,
			status: "COMPLETED",
			note: "",
			sample: true,
			createdAt: now - 18e6,
			updatedAt: now - 108e5,
			completedAt: now - 108e5
		},
		{
			id: nid(),
			productCode: "SP-002",
			designCode: "TK-B04",
			receivedAt: now - 72e5,
			invoice: "INV-260901-02",
			lot: "LOT-260901-09",
			quantity: 800,
			status: "MISSING",
			note: "Thiếu 40 pcs so với invoice",
			sample: true,
			createdAt: now - 72e5,
			updatedAt: now - 12e5,
			completedAt: null
		},
		{
			id: nid(),
			productCode: "SP-003",
			designCode: "TK-C21",
			receivedAt: now - 36e5,
			invoice: "INV-260901-03",
			lot: "LOT-260901-10",
			quantity: 500,
			status: "PROCESSING",
			note: "",
			sample: true,
			createdAt: now - 36e5,
			updatedAt: now - 36e5,
			completedAt: null
		}
	];
	await db.dataItems.bulkAdd(dataItems);
	const goods = [
		{
			id: nid(),
			invoice: "INV-260901-01",
			itemCode: "HX-001",
			productCode: "SP-001",
			lot: "LOT-260901-08",
			quantity: 1200,
			exportDate: today,
			status: "COMPLETED",
			note: "",
			sample: true,
			createdAt: now - 144e5,
			updatedAt: now - 72e5
		},
		{
			id: nid(),
			invoice: "INV-260901-02",
			itemCode: "HX-002",
			productCode: "SP-002",
			lot: "LOT-260901-09",
			quantity: 760,
			exportDate: today,
			status: "MISSING",
			note: "Thiếu 40",
			sample: true,
			createdAt: now - 72e5,
			updatedAt: now - 9e5
		},
		{
			id: nid(),
			invoice: "INV-260901-03",
			itemCode: "HX-003",
			productCode: "SP-003",
			lot: "LOT-260901-10",
			quantity: 500,
			exportDate: today,
			status: "PREPARING",
			note: "",
			sample: true,
			createdAt: now - 3e6,
			updatedAt: now - 3e6
		}
	];
	await db.goodsItems.bulkAdd(goods);
	const lots = [
		{
			id: nid(),
			lotCode: "LOT-260901-08",
			invoice: "INV-260901-01",
			productCode: "SP-001",
			date: today,
			quantity: 1200,
			status: "CLOSED",
			sample: true,
			createdAt: now - 144e5
		},
		{
			id: nid(),
			lotCode: "LOT-260901-09",
			invoice: "INV-260901-02",
			productCode: "SP-002",
			date: today,
			quantity: 800,
			status: "OPEN",
			sample: true,
			createdAt: now - 72e5
		},
		{
			id: nid(),
			lotCode: "LOT-260901-10",
			invoice: "INV-260901-03",
			productCode: "SP-003",
			date: today,
			quantity: 500,
			status: "PROCESSING",
			sample: true,
			createdAt: now - 36e5
		}
	];
	await db.lots.bulkAdd(lots);
	const closed = lots[0];
	await db.lotClosures.add({
		id: nid(),
		lotId: closed.id,
		closedBy: binh.id,
		closedAt: now - 54e5,
		note: "Đủ số lượng, ảnh đã lưu",
		photoId: null
	});
	const ots = [{
		id: nid(),
		employeeId: cuong.id,
		date: addDays(today, -1),
		shiftId: ca1,
		startTime: "14:00",
		endTime: "16:30",
		totalMinutes: 150,
		type: "Ngày thường",
		note: "Hỗ trợ chốt lot",
		sample: true,
		createdAt: now - 72e6
	}, {
		id: nid(),
		employeeId: em.id,
		date: today,
		shiftId: ca1,
		startTime: "14:00",
		endTime: "15:00",
		totalMinutes: 60,
		type: "Ngày thường",
		note: "",
		sample: true,
		createdAt: now
	}];
	await db.overtimes.bulkAdd(ots);
	const amhs = [{
		id: nid(),
		employeeId: cuong.id,
		date: addDays(today, -1),
		shiftId: ca1,
		hours: 2.5,
		status: "APPROVED",
		note: "Liên kết OT hôm qua",
		taskId: null,
		sample: true,
		createdAt: now - 72e6
	}];
	await db.amhs.bulkAdd(amhs);
	const three = {
		id: nid(),
		date: today,
		shiftId: ca1,
		note: "Khu đóng gói",
		completedAt: null,
		sample: true,
		createdAt: now - 108e5
	};
	await db.threeS.add(three);
	const s3ChecklistItems = [
		"Sàng lọc",
		"Sắp xếp",
		"Sạch sẽ",
		"Săn sóc / Duy trì",
		"Sẵn sàng / Kỷ luật",
		"3D"
	].map((label, i) => ({
		id: nid(),
		checklistId: `threes-${three.id}`,
		taskId: null,
		threeSId: three.id,
		label,
		done: i < 3,
		completedAt: i < 3 ? now - 72e5 : null,
		completedBy: i < 3 ? em.id : null,
		photoId: null,
		note: "",
		order: i + 1,
		sample: true
	}));
	await db.checklistItems.bulkAdd(s3ChecklistItems);
	const abs = [{
		id: nid(),
		type: "DATA thiếu",
		description: "SP-002 thiếu 40 pcs so với invoice INV-260901-02",
		severity: "HIGH",
		detectedBy: dung.id,
		detectedAt: now - 15e5,
		handlerId: binh.id,
		deadline: now + 72e5,
		status: "PROCESSING",
		linkedModule: "dataItems",
		linkedId: dataItems[1].id,
		sample: true,
		createdAt: now - 15e5,
		updatedAt: now - 6e5
	}, {
		id: nid(),
		type: "3S / 3D",
		description: "Góc kệ B chưa sắp xếp, thùng rỗng để dưới đất",
		severity: "MEDIUM",
		detectedBy: em.id,
		detectedAt: now - 3e6,
		handlerId: em.id,
		deadline: now + 36e5,
		status: "NEW",
		linkedModule: "threeS",
		linkedId: three.id,
		sample: true,
		createdAt: now - 3e6,
		updatedAt: now - 3e6
	}];
	await db.abnormalities.bulkAdd(abs);
	await db.settings.put({
		key: "sampleData",
		value: "true"
	});
	await db.settings.put({
		key: "currentUserId",
		value: an.id
	});
}
async function clearSampleData(db) {
	const tables = [
		db.employees,
		db.attendance,
		db.tasks,
		db.checklistItems,
		db.overtimes,
		db.amhs,
		db.dataItems,
		db.goodsItems,
		db.lots,
		db.threeS,
		db.abnormalities
	];
	await db.transaction("rw", [
		...tables,
		db.lotClosures,
		db.photos,
		db.blobs,
		db.auditLogs
	], async () => {
		for (const table of tables) await table.filter((row) => Boolean(row.sample)).delete();
		await db.settings.put({
			key: "sampleData",
			value: "false"
		});
	});
}
//#endregion
//#region src/lib/cvp/reminders.ts
var lastTick = 0;
async function tickReminders() {
	if (!canUseDb()) return;
	const now = Date.now();
	if (now - lastTick < 3e4) return;
	lastTick = now;
	const db = getDb();
	if (!useAppStore.getState().ready) return;
	const dueTasks = await db.tasks.filter((t) => t.status !== "COMPLETED" && t.deadline !== null && t.deadline < now + 18e5).toArray();
	for (const t of dueTasks) {
		if (await db.notifications.filter((n) => n.recordId === t.id && n.module === "tasks" && now - n.createdAt < 72e5).first()) continue;
		const overdue = t.deadline !== null && t.deadline < now;
		await db.notifications.add({
			id: nid(),
			title: overdue ? "Công việc quá hạn" : "Công việc sắp đến hạn",
			body: t.name,
			module: "tasks",
			recordId: t.id,
			dueAt: t.deadline ?? now,
			read: false,
			createdAt: now
		});
		notifyBrowser(overdue ? "Công việc quá hạn" : "Sắp đến hạn", t.name);
	}
	const missingData = await db.dataItems.filter((d) => d.status === "MISSING" || d.status === "NEW" || d.status === "PROCESSING").toArray();
	for (const d of missingData) {
		if (await db.notifications.filter((n) => n.recordId === d.id && n.module === "dataItems" && now - n.createdAt < 144e5).first()) continue;
		await db.notifications.add({
			id: nid(),
			title: d.status === "MISSING" ? "DATA thiếu" : "DATA chưa hoàn thành",
			body: `${d.productCode} · ${d.invoice}`,
			module: "dataItems",
			recordId: d.id,
			dueAt: now,
			read: false,
			createdAt: now
		});
	}
	const openLots = await db.lots.filter((l) => l.status !== "CLOSED").toArray();
	for (const lot of openLots) {
		if (await db.notifications.filter((n) => n.recordId === lot.id && n.module === "lots" && now - n.createdAt < 144e5).first()) continue;
		await db.notifications.add({
			id: nid(),
			title: "Lot chưa chốt",
			body: lot.lotCode,
			module: "lots",
			recordId: lot.id,
			dueAt: now,
			read: false,
			createdAt: now
		});
	}
}
function notifyBrowser(title, body) {
	if (typeof Notification === "undefined") return;
	if (Notification.permission === "granted") try {
		new Notification(title, { body });
	} catch {}
}
async function requestNotifyPermission() {
	if (typeof Notification === "undefined") return false;
	if (Notification.permission === "granted") return true;
	return await Notification.requestPermission() === "granted";
}
//#endregion
//#region src/lib/cvp/init.ts
var started = false;
async function initApp() {
	if (!canUseDb()) {
		useAppStore.getState().setReady(true);
		return;
	}
	const db = getDb();
	await db.open();
	if (!await db.settings.get("initialized")) {
		await seedCatalog(db);
		await seedSampleData(db);
		await db.settings.put({
			key: "initialized",
			value: "true"
		});
		await db.settings.put({
			key: "otRoundMinutes",
			value: "30"
		});
	}
	const sample = (await db.settings.get("sampleData"))?.value === "true";
	const userId = (await db.settings.get("currentUserId"))?.value ?? null;
	const user = userId ? await db.employees.get(userId) : null;
	const otRound = Number((await db.settings.get("otRoundMinutes"))?.value ?? 30);
	const autoShift = (await db.settings.get("autoShift"))?.value !== "false";
	const savedShift = (await db.settings.get("selectedShiftId"))?.value ?? null;
	const savedDate = (await db.settings.get("selectedDate"))?.value ?? formatDate(/* @__PURE__ */ new Date());
	const shifts = await db.shifts.orderBy("order").toArray();
	const active = getActiveContext(/* @__PURE__ */ new Date(), shifts);
	const shiftId = autoShift ? active?.shift.id ?? savedShift ?? shifts[0]?.id ?? null : savedShift;
	const date = autoShift && active ? active.date : savedDate;
	useAppStore.getState().hydrate({
		currentUserId: user?.id ?? null,
		currentUserName: user?.name ?? "Hệ thống",
		role: user?.role ?? "ADMIN",
		selectedDate: date,
		selectedShiftId: shiftId,
		autoShift,
		otRoundMinutes: Number.isFinite(otRound) ? otRound : 30,
		sampleData: sample
	});
	await refreshOverdueTasks();
	useAppStore.getState().setReady(true);
	if (!started) {
		started = true;
		window.setInterval(() => {
			tickReminders();
		}, 6e4);
		tickReminders();
	}
}
async function applyCurrentUser(id) {
	const db = getDb();
	const user = id ? await db.employees.get(id) : null;
	useAppStore.getState().setUser(user?.id ?? null, user?.name ?? "Hệ thống", user?.role ?? "ADMIN");
	await persistSetting("currentUserId", user?.id ?? "");
}
async function applyShift(id, auto) {
	useAppStore.getState().setShift(id, auto);
	await persistSetting("selectedShiftId", id ?? "");
	await persistSetting("autoShift", auto ? "true" : "false");
}
async function applyDate(date) {
	useAppStore.getState().setDate(date);
	await persistSetting("selectedDate", date);
}
async function wipeSample() {
	await clearSampleData(getDb());
	useAppStore.getState().setSampleData(false);
}
//#endregion
//#region src/components/cvp/abnormal-dialog.tsx
function AbnormalDialog({ open, onClose, linkedModule, linkedId }) {
	const userId = useAppStore((s) => s.currentUserId);
	const people = useRows(() => getDb().employees.toArray());
	const [type, setType] = useState(ABNORMAL_TYPES[0]);
	const [description, setDescription] = useState("");
	const [severity, setSeverity] = useState("MEDIUM");
	const [handlerId, setHandlerId] = useState("");
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onClose,
		title: "Báo bất thường",
		children: /* @__PURE__ */ jsxs("form", {
			className: "space-y-3",
			onSubmit: async (e) => {
				e.preventDefault();
				if (!description.trim()) {
					toast.error("Nhập mô tả");
					return;
				}
				await createAbnormal({
					type,
					description: description.trim(),
					severity,
					detectedBy: userId ?? people[0]?.id ?? "",
					detectedAt: Date.now(),
					handlerId: handlerId || null,
					deadline: Date.now() + 144e5,
					status: "NEW",
					linkedModule: linkedModule ?? null,
					linkedId: linkedId ?? null
				});
				toast.success("Đã ghi bất thường");
				setDescription("");
				onClose();
			},
			children: [
				/* @__PURE__ */ jsx(Field, {
					label: "Loại",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: type,
						onChange: (e) => setType(e.target.value),
						children: ABNORMAL_TYPES.map((t) => /* @__PURE__ */ jsx("option", { children: t }, t))
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Mức độ",
					children: /* @__PURE__ */ jsxs(NativeSelect, {
						value: severity,
						onChange: (e) => setSeverity(e.target.value),
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "LOW",
								children: "Thấp"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "MEDIUM",
								children: "Trung bình"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "HIGH",
								children: "Cao"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "CRITICAL",
								children: "Nghiêm trọng"
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Mô tả",
					children: /* @__PURE__ */ jsx(Textarea, {
						value: description,
						onChange: (e) => setDescription(e.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Người xử lý",
					children: /* @__PURE__ */ jsxs(NativeSelect, {
						value: handlerId,
						onChange: (e) => setHandlerId(e.target.value),
						children: [/* @__PURE__ */ jsx("option", {
							value: "",
							children: "Chưa gán"
						}), people.map((p) => /* @__PURE__ */ jsx("option", {
							value: p.id,
							children: p.name
						}, p.id))]
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Liên kết",
					children: /* @__PURE__ */ jsx(Input, {
						readOnly: true,
						value: linkedModule ? `${linkedModule}${linkedId ? ` · ${linkedId.slice(0, 8)}` : ""}` : "Không"
					})
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "submit",
					className: "w-full",
					children: "Lưu bất thường"
				})
			]
		})
	});
}
//#endregion
//#region src/components/layout/app-shell.tsx
var NAV = [
	{
		to: "/",
		label: "Ca",
		icon: LayoutDashboard
	},
	{
		to: "/unfinished",
		label: "Chưa xong",
		icon: ClipboardList
	},
	{
		to: "/scan",
		label: "Quét",
		icon: QrCode
	},
	{
		to: "/goods",
		label: "Hàng",
		icon: Package
	},
	{
		to: "/more",
		label: "Thêm",
		icon: MoreHorizontal
	}
];
function AppShell({ children }) {
	const ready = useAppStore((s) => s.ready);
	const date = useAppStore((s) => s.selectedDate);
	const shiftId = useAppStore((s) => s.selectedShiftId);
	const autoShift = useAppStore((s) => s.autoShift);
	const userName = useAppStore((s) => s.currentUserName);
	const sample = useAppStore((s) => s.sampleData);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [abnormal, setAbnormal] = useState(false);
	const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
	const shift = shifts.find((s) => s.id === shiftId);
	useEffect(() => {
		initApp();
	}, []);
	if (!ready) return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-dvh items-center justify-center bg-bg text-fg",
		children: /* @__PURE__ */ jsx("p", {
			className: "text-sm text-muted",
			children: "Đang mở dữ liệu ca…"
		})
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "sticky top-0 z-30 border-b border-border bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto flex max-w-5xl items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-medium uppercase tracking-[0.14em] text-muted",
								children: "CongViecPro"
							}), /* @__PURE__ */ jsxs("p", {
								className: "truncate text-sm",
								children: [formatDateVi(date), shift ? ` · ${shift.name} ${shift.startTime}–${shift.endTime}` : ""]
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ jsx(Link, {
									to: "/search",
									className: "inline-flex size-11 items-center justify-center rounded-md text-fg",
									"aria-label": "Tìm kiếm",
									children: /* @__PURE__ */ jsx(Search, { className: "size-5" })
								}),
								/* @__PURE__ */ jsx(Button, {
									variant: "ghost",
									size: "icon",
									className: "size-11",
									"aria-label": "Báo bất thường",
									onClick: () => setAbnormal(true),
									children: /* @__PURE__ */ jsx(TriangleAlert, { className: "size-5" })
								}),
								/* @__PURE__ */ jsx(Link, {
									to: "/settings",
									className: "inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold",
									"aria-label": "Tài khoản",
									children: userName.slice(0, 1)
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto mt-2 flex max-w-5xl gap-2",
						children: [/* @__PURE__ */ jsx("input", {
							type: "date",
							value: date,
							onChange: (e) => void applyDate(e.target.value),
							className: "h-10 flex-1 rounded-md bg-surface-2 px-2 text-sm shadow-[var(--shadow-border)]"
						}), /* @__PURE__ */ jsx(NativeSelect, {
							className: "h-10 flex-[1.4] text-sm",
							value: shiftId ?? "",
							onChange: (e) => void applyShift(e.target.value || null, false),
							children: shifts.map((s) => /* @__PURE__ */ jsxs("option", {
								value: s.id,
								children: [
									s.name,
									" ",
									s.startTime,
									"–",
									s.endTime
								]
							}, s.id))
						})]
					}),
					sample ? /* @__PURE__ */ jsx("p", {
						className: "mx-auto mt-2 max-w-5xl text-xs text-warn",
						children: "Đang dùng dữ liệu mẫu. Xóa trong Cài đặt khi bắt đầu ca thật."
					}) : null,
					!autoShift ? /* @__PURE__ */ jsx("p", {
						className: "mx-auto mt-1 max-w-5xl text-xs text-muted",
						children: "Ca đang chọn thủ công."
					}) : null
				]
			}),
			/* @__PURE__ */ jsx("main", {
				className: "mx-auto max-w-5xl px-4 py-4 pb-28",
				children
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)]",
				children: /* @__PURE__ */ jsx("ul", {
					className: "mx-auto grid max-w-5xl grid-cols-5",
					children: NAV.map((item) => {
						const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
							to: item.to,
							className: cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]", active ? "text-fg" : "text-muted"),
							children: [/* @__PURE__ */ jsx(Icon, { className: "size-5" }), item.label]
						}) }, item.to);
					})
				})
			}),
			/* @__PURE__ */ jsx(AbnormalDialog, {
				open: abnormal,
				onClose: () => setAbnormal(false)
			}),
			/* @__PURE__ */ jsx(Toaster, {
				theme: "dark",
				position: "top-center"
			})
		]
	});
}
//#endregion
//#region src/styles.css?url
var styles_default = "/assets/styles-D5EXl3GF.css";
//#endregion
//#region src/routes/__root.tsx
var APP_NAME = "CongViecPro";
var Route$28 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0C0D0F"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			},
			{
				name: "description",
				content: "Quản lý công việc, nhân sự, DATA, hàng xuất, Lot và OT trong ca — offline trên điện thoại."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ jsxs("html", {
		lang: "vi",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsx(PreviewHostBridge, {}),
			/* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(Outlet, {}) }) }),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	})
});
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$27 = () => import("./routes-BkgGJZ1s.js");
var Route$27 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$27, "component") });
//#endregion
//#region src/routes/abnormal.tsx
var $$splitComponentImporter$26 = () => import("./abnormal-C_1akNIi.js");
var Route$26 = createFileRoute("/abnormal")({ component: lazyRouteComponent($$splitComponentImporter$26, "component") });
//#endregion
//#region src/routes/attendance.tsx
var $$splitComponentImporter$25 = () => import("./attendance-0BJGb8sC.js");
var Route$25 = createFileRoute("/attendance")({ component: lazyRouteComponent($$splitComponentImporter$25, "component") });
//#endregion
//#region src/routes/backup.tsx
var $$splitComponentImporter$24 = () => import("./backup-B3eublng.js");
var Route$24 = createFileRoute("/backup")({ component: lazyRouteComponent($$splitComponentImporter$24, "component") });
//#endregion
//#region src/routes/goods.tsx
var $$splitComponentImporter$23 = () => import("./goods-DDfwlobR.js");
var Route$23 = createFileRoute("/goods")({ component: lazyRouteComponent($$splitComponentImporter$23, "component") });
//#endregion
//#region src/routes/handover.tsx
var $$splitComponentImporter$22 = () => import("./handover-BKDINf8G.js");
var Route$22 = createFileRoute("/handover")({ component: lazyRouteComponent($$splitComponentImporter$22, "component") });
//#endregion
//#region src/routes/mail.tsx
var $$splitComponentImporter$21 = () => import("./mail-NnfqHs0T.js");
var Route$21 = createFileRoute("/mail")({ component: lazyRouteComponent($$splitComponentImporter$21, "component") });
//#endregion
//#region src/routes/more.tsx
var $$splitComponentImporter$20 = () => import("./more-BOnLBTu2.js");
var Route$20 = createFileRoute("/more")({ component: lazyRouteComponent($$splitComponentImporter$20, "component") });
//#endregion
//#region src/routes/ot.tsx
var $$splitComponentImporter$19 = () => import("./ot-CGJIQ26Z.js");
var Route$19 = createFileRoute("/ot")({ component: lazyRouteComponent($$splitComponentImporter$19, "component") });
//#endregion
//#region src/routes/people.tsx
var $$splitComponentImporter$18 = () => import("./people-C_bD83Ha.js");
var Route$18 = createFileRoute("/people")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
//#endregion
//#region src/routes/reports.tsx
var $$splitComponentImporter$17 = () => import("./reports-BdmHrcmY.js");
var Route$17 = createFileRoute("/reports")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
//#endregion
//#region src/routes/scan.tsx
var $$splitComponentImporter$16 = () => import("./scan-BvCTnWD7.js");
var Route$16 = createFileRoute("/scan")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
//#endregion
//#region src/routes/search.tsx
var $$splitComponentImporter$15 = () => import("./search-qmN2b82d.js");
var Route$15 = createFileRoute("/search")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
//#endregion
//#region src/routes/settings.tsx
var $$splitComponentImporter$14 = () => import("./settings-DJXYgB9h.js");
var Route$14 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
//#endregion
//#region src/routes/shift-log.tsx
var $$splitComponentImporter$13 = () => import("./shift-log-B7JbMZAB.js");
var Route$13 = createFileRoute("/shift-log")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
//#endregion
//#region src/routes/tasks.tsx
var $$splitComponentImporter$12 = () => import("./tasks-DZK0A27-.js");
var Route$12 = createFileRoute("/tasks")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
//#endregion
//#region src/routes/threes.tsx
var $$splitComponentImporter$11 = () => import("./threes-0aOGLV87.js");
var Route$11 = createFileRoute("/threes")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
//#endregion
//#region src/routes/unfinished.tsx
var $$splitComponentImporter$10 = () => import("./unfinished-CPlG51YR.js");
var Route$10 = createFileRoute("/unfinished")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
//#endregion
//#region src/routes/abnormal.index.tsx
var $$splitComponentImporter$9 = () => import("./abnormal.index-BUI5wG0S.js");
var Route$9 = createFileRoute("/abnormal/")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
//#endregion
//#region src/routes/abnormal.$id.tsx
var $$splitComponentImporter$8 = () => import("./abnormal._id-DYItLNzT.js");
var Route$8 = createFileRoute("/abnormal/$id")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
//#endregion
//#region src/routes/goods.index.tsx
var $$splitComponentImporter$7 = () => import("./goods.index-BcY2HS04.js");
var Route$7 = createFileRoute("/goods/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
//#endregion
//#region src/routes/people.index.tsx
var $$splitComponentImporter$6 = () => import("./people.index-BM3DTVTI.js");
var Route$6 = createFileRoute("/people/")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
//#endregion
//#region src/routes/people.$id.tsx
var $$splitComponentImporter$5 = () => import("./people._id-BLAwOIol.js");
var Route$5 = createFileRoute("/people/$id")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
//#endregion
//#region src/routes/tasks.index.tsx
var $$splitComponentImporter$4 = () => import("./tasks.index-sBxn-_eC.js");
var Route$4 = createFileRoute("/tasks/")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
//#endregion
//#region src/routes/tasks.$id.tsx
var $$splitComponentImporter$3 = () => import("./tasks._id-DMHptajb.js");
var Route$3 = createFileRoute("/tasks/$id")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
//#endregion
//#region src/routes/goods.data.$id.tsx
var $$splitComponentImporter$2 = () => import("./goods.data._id-e4ECW6BU.js");
var Route$2 = createFileRoute("/goods/data/$id")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/routes/goods.export.$id.tsx
var $$splitComponentImporter$1 = () => import("./goods.export._id-BUCc0rl1.js");
var Route$1 = createFileRoute("/goods/export/$id")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/routes/goods.lot.$id.tsx
var $$splitComponentImporter = () => import("./goods.lot._id-B1s2V1PA.js");
var Route = createFileRoute("/goods/lot/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
//#endregion
//#region src/routeTree.gen.ts
var IndexRoute = Route$27.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$28
});
var AbnormalRoute = Route$26.update({
	id: "/abnormal",
	path: "/abnormal",
	getParentRoute: () => Route$28
});
var AttendanceRoute = Route$25.update({
	id: "/attendance",
	path: "/attendance",
	getParentRoute: () => Route$28
});
var BackupRoute = Route$24.update({
	id: "/backup",
	path: "/backup",
	getParentRoute: () => Route$28
});
var GoodsRoute = Route$23.update({
	id: "/goods",
	path: "/goods",
	getParentRoute: () => Route$28
});
var HandoverRoute = Route$22.update({
	id: "/handover",
	path: "/handover",
	getParentRoute: () => Route$28
});
var MailRoute = Route$21.update({
	id: "/mail",
	path: "/mail",
	getParentRoute: () => Route$28
});
var MoreRoute = Route$20.update({
	id: "/more",
	path: "/more",
	getParentRoute: () => Route$28
});
var OtRoute = Route$19.update({
	id: "/ot",
	path: "/ot",
	getParentRoute: () => Route$28
});
var PeopleRoute = Route$18.update({
	id: "/people",
	path: "/people",
	getParentRoute: () => Route$28
});
var ReportsRoute = Route$17.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => Route$28
});
var ScanRoute = Route$16.update({
	id: "/scan",
	path: "/scan",
	getParentRoute: () => Route$28
});
var SearchRoute = Route$15.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$28
});
var SettingsRoute = Route$14.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$28
});
var ShiftLogRoute = Route$13.update({
	id: "/shift-log",
	path: "/shift-log",
	getParentRoute: () => Route$28
});
var TasksRoute = Route$12.update({
	id: "/tasks",
	path: "/tasks",
	getParentRoute: () => Route$28
});
var ThreesRoute = Route$11.update({
	id: "/threes",
	path: "/threes",
	getParentRoute: () => Route$28
});
var UnfinishedRoute = Route$10.update({
	id: "/unfinished",
	path: "/unfinished",
	getParentRoute: () => Route$28
});
var AbnormalIndexRoute = Route$9.update({
	id: "/",
	path: "/",
	getParentRoute: () => AbnormalRoute
});
var AbnormalIdRoute = Route$8.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => AbnormalRoute
});
var GoodsIndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => GoodsRoute
});
var PeopleIndexRoute = Route$6.update({
	id: "/",
	path: "/",
	getParentRoute: () => PeopleRoute
});
var PeopleIdRoute = Route$5.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => PeopleRoute
});
var TasksIndexRoute = Route$4.update({
	id: "/",
	path: "/",
	getParentRoute: () => TasksRoute
});
var TasksIdRoute = Route$3.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => TasksRoute
});
var GoodsDataIdRoute = Route$2.update({
	id: "/data/$id",
	path: "/data/$id",
	getParentRoute: () => GoodsRoute
});
var GoodsExportIdRoute = Route$1.update({
	id: "/export/$id",
	path: "/export/$id",
	getParentRoute: () => GoodsRoute
});
var GoodsLotIdRoute = Route.update({
	id: "/lot/$id",
	path: "/lot/$id",
	getParentRoute: () => GoodsRoute
});
var AbnormalRouteChildren = {
	AbnormalIdRoute,
	AbnormalIndexRoute
};
var AbnormalRouteWithChildren = AbnormalRoute._addFileChildren(AbnormalRouteChildren);
var GoodsRouteChildren = {
	GoodsIndexRoute,
	GoodsDataIdRoute,
	GoodsExportIdRoute,
	GoodsLotIdRoute
};
var GoodsRouteWithChildren = GoodsRoute._addFileChildren(GoodsRouteChildren);
var PeopleRouteChildren = {
	PeopleIdRoute,
	PeopleIndexRoute
};
var PeopleRouteWithChildren = PeopleRoute._addFileChildren(PeopleRouteChildren);
var TasksRouteChildren = {
	TasksIdRoute,
	TasksIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AbnormalRoute: AbnormalRouteWithChildren,
	AttendanceRoute,
	BackupRoute,
	GoodsRoute: GoodsRouteWithChildren,
	HandoverRoute,
	MailRoute,
	MoreRoute,
	OtRoute,
	PeopleRoute: PeopleRouteWithChildren,
	ReportsRoute,
	ScanRoute,
	SearchRoute,
	SettingsRoute,
	ShiftLogRoute,
	TasksRoute: TasksRoute._addFileChildren(TasksRouteChildren),
	ThreesRoute,
	UnfinishedRoute
};
var routeTree = Route$28._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route$3 as a, AbnormalDialog as c, wipeSample as d, requestNotifyPermission as f, getRouter, Route$2 as i, applyCurrentUser as l, Route as n, Route$5 as o, Route$1 as r, Route$8 as s, router_exports as t, applyShift as u };
