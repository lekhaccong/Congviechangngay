import { f as startOfMonth, h as getDb, n as addDays, p as startOfWeek, s as formatHours, t as useAppStore } from "./store-Crr6urgA.js";
import { n as useRows } from "./hooks-aAbOfvjR.js";
import { n as PageHeader, r as Stat } from "./page-header-BTcUZZCF.js";
import { t as FilterChip } from "./filter-chip-TMIIHD5x.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
//#region src/routes/reports.tsx?tsr-split=component
function ReportsPage() {
	const date = useAppStore((s) => s.selectedDate);
	const [range, setRange] = useState("day");
	const from = range === "day" ? date : range === "week" ? startOfWeek(date) : startOfMonth(date);
	const to = date;
	const tasks = useRows(() => getDb().tasks.toArray());
	const dataItems = useRows(() => getDb().dataItems.toArray());
	const lots = useRows(() => getDb().lots.toArray());
	const goods = useRows(() => getDb().goodsItems.toArray());
	const ots = useRows(() => getDb().overtimes.toArray());
	const amhs = useRows(() => getDb().amhs.toArray());
	const people = useRows(() => getDb().employees.toArray());
	const abs = useRows(() => getDb().abnormalities.toArray());
	const inRange = (d) => d >= from && d <= to;
	const t = tasks.filter((x) => inRange(x.date));
	const o = ots.filter((x) => inRange(x.date));
	const l = lots.filter((x) => inRange(x.date));
	const g = goods.filter((x) => inRange(x.exportDate));
	const chart = useMemo(() => {
		const days = [];
		let cur = from;
		while (cur <= to) {
			const dayTasks = tasks.filter((x) => x.date === cur);
			days.push({
				name: cur.slice(8),
				xong: dayTasks.filter((x) => x.status === "COMPLETED").length,
				dang: dayTasks.filter((x) => x.status !== "COMPLETED").length
			});
			cur = addDays(cur, 1);
			if (days.length > 31) break;
		}
		return days;
	}, [
		from,
		to,
		tasks
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsx(PageHeader, {
				title: "Báo cáo",
				subtitle: `${from} → ${to}`
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex gap-2",
				children: [
					"day",
					"week",
					"month"
				].map((r) => /* @__PURE__ */ jsx(FilterChip, {
					active: range === r,
					onClick: () => setRange(r),
					children: r === "day" ? "Ngày" : r === "week" ? "Tuần" : "Tháng"
				}, r))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ jsx(Stat, {
						label: "Công việc",
						value: t.length,
						hint: `Xong ${t.filter((x) => x.status === "COMPLETED").length}`
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Quá hạn",
						value: t.filter((x) => x.status === "OVERDUE").length,
						tone: "danger"
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "DATA",
						value: dataItems.length,
						hint: `Thiếu ${dataItems.filter((d) => d.status === "MISSING").length}`
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Lot đã chốt",
						value: l.filter((x) => x.status === "CLOSED").length,
						hint: `${l.length} lot`
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Hàng xuất",
						value: g.length
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "OT",
						value: `${formatHours(o.reduce((s, x) => s + x.totalMinutes, 0))}h`
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "AMH",
						value: amhs.length
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Nhân sự",
						value: people.filter((p) => p.status === "ACTIVE").length
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Bất thường",
						value: abs.filter((a) => a.status !== "CLOSED").length,
						tone: "warn"
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-3 text-sm font-medium text-muted",
					children: "Công việc theo ngày"
				}), /* @__PURE__ */ jsx("div", {
					className: "h-48",
					children: /* @__PURE__ */ jsx(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ jsxs(BarChart, {
							data: chart,
							children: [
								/* @__PURE__ */ jsx(CartesianGrid, {
									stroke: "rgba(236,236,232,0.08)",
									vertical: false
								}),
								/* @__PURE__ */ jsx(XAxis, {
									dataKey: "name",
									stroke: "#8b8e96",
									fontSize: 11
								}),
								/* @__PURE__ */ jsx(YAxis, {
									stroke: "#8b8e96",
									fontSize: 11,
									allowDecimals: false
								}),
								/* @__PURE__ */ jsx(Tooltip, { contentStyle: {
									background: "#16181c",
									border: "1px solid #2a2d33",
									borderRadius: 8
								} }),
								/* @__PURE__ */ jsx(Bar, {
									dataKey: "xong",
									fill: "#6f9e7a",
									radius: [
										4,
										4,
										0,
										0
									]
								}),
								/* @__PURE__ */ jsx(Bar, {
									dataKey: "dang",
									fill: "#6e8fad",
									radius: [
										4,
										4,
										0,
										0
									]
								})
							]
						})
					})
				})]
			})
		]
	});
}
//#endregion
export { ReportsPage as component };
