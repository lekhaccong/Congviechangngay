import { t as cn } from "./utils-C_uf36nf.js";
import { c as EMPLOYEE_STATUS_LABEL, h as TASK_STATUS_LABEL, l as GOODS_STATUS_LABEL, o as ATTENDANCE_STATUS_LABEL, r as AMH_STATUS_LABEL, s as DATA_STATUS_LABEL, t as ABNORMAL_STATUS_LABEL, u as LOT_STATUS_LABEL } from "./types-hR0syAmZ.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/badge.tsx
var tones = {
	default: "bg-surface-2 text-fg",
	ok: "bg-ok/15 text-ok",
	warn: "bg-warn/15 text-warn",
	danger: "bg-danger/15 text-danger",
	info: "bg-info/15 text-info",
	muted: "bg-surface-2 text-muted"
};
function Badge({ className, tone = "default", children }) {
	return /* @__PURE__ */ jsx("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className),
		children
	});
}
//#endregion
//#region src/components/cvp/status-badge.tsx
function taskTone(s) {
	if (s === "COMPLETED") return "ok";
	if (s === "OVERDUE") return "danger";
	if (s === "IN_PROGRESS") return "info";
	if (s === "PAUSED") return "warn";
	return "muted";
}
function dataTone(s) {
	if (s === "COMPLETED" || s === "ENOUGH" || s === "PUSHED") return "ok";
	if (s === "MISSING") return "danger";
	if (s === "PROCESSING") return "info";
	return "muted";
}
function goodsTone(s) {
	if (s === "COMPLETED" || s === "ENOUGH") return "ok";
	if (s === "MISSING") return "danger";
	if (s === "PROCESSING" || s === "PREPARING") return "info";
	return "muted";
}
function lotTone(s) {
	if (s === "CLOSED" || s === "ENOUGH") return "ok";
	if (s === "PROCESSING") return "info";
	return "warn";
}
function TaskBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: taskTone(status),
		children: TASK_STATUS_LABEL[status]
	});
}
function DataBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: dataTone(status),
		children: DATA_STATUS_LABEL[status]
	});
}
function GoodsBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: goodsTone(status),
		children: GOODS_STATUS_LABEL[status]
	});
}
function LotBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: lotTone(status),
		children: LOT_STATUS_LABEL[status]
	});
}
function AbnormalBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: status === "CLOSED" || status === "RESOLVED" ? "ok" : status === "NEW" ? "danger" : "warn",
		children: ABNORMAL_STATUS_LABEL[status]
	});
}
function AttendanceBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: status === "PRESENT" || status === "CHECKED_IN" || status === "OVERTIME" ? "ok" : status === "ABSENT" ? "danger" : "warn",
		children: ATTENDANCE_STATUS_LABEL[status]
	});
}
function EmployeeBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: status === "ACTIVE" ? "ok" : status === "LEAVE" ? "warn" : "muted",
		children: EMPLOYEE_STATUS_LABEL[status]
	});
}
function AmhBadge({ status }) {
	return /* @__PURE__ */ jsx(Badge, {
		tone: status === "APPROVED" || status === "DONE" ? "ok" : status === "REJECTED" ? "danger" : "info",
		children: AMH_STATUS_LABEL[status]
	});
}
//#endregion
export { EmployeeBadge as a, TaskBadge as c, DataBadge as i, AmhBadge as n, GoodsBadge as o, AttendanceBadge as r, LotBadge as s, AbnormalBadge as t };
