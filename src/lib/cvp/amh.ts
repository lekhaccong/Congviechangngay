import { BUSINESS_SHIFT_RULES } from "./business-shifts.ts";
import type { Amh, Attendance, BusinessShiftCode, Overtime } from "./types.ts";

const MINUTE = 60_000;

function clockMinutes(value: string): number {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function plannedMinutesForShift(code: BusinessShiftCode): number {
  const rule = BUSINESS_SHIFT_RULES[code];
  if (!rule.working) return 0;
  const start = clockMinutes(rule.startTime);
  const end = clockMinutes(rule.endTime);
  return end >= start ? end - start : 24 * 60 - start + end;
}

function shiftBounds(date: string, code: BusinessShiftCode): { start: number; end: number } {
  const rule = BUSINESS_SHIFT_RULES[code];
  const start = new Date(`${date}T${rule.startTime}:00`).getTime();
  let end = new Date(`${date}T${rule.endTime}:00`).getTime();
  if (end <= start) end += 24 * 60 * MINUTE;
  return { start, end };
}

export interface AmhCalculation {
  regularMinutes: number;
  overtimeMinutes: number;
  adjustmentMinutes: number;
  totalMinutes: number;
  state: "ABSENT" | "UNCONFIRMED" | "OPEN" | "CONFIRMED";
}

/** AMH = giờ làm trong ca thực tế + OT đã xác nhận + điều chỉnh AMH đã duyệt. */
export function calculateEmployeeAmh(input: {
  date: string;
  shiftCode: BusinessShiftCode;
  attendance?: Attendance;
  overtimes: Overtime[];
  adjustments: Amh[];
}): AmhCalculation {
  const { date, shiftCode, attendance } = input;
  const planned = plannedMinutesForShift(shiftCode);
  let regularMinutes = 0;
  let state: AmhCalculation["state"] = "UNCONFIRMED";

  if (attendance?.status === "ABSENT") {
    state = "ABSENT";
  } else if (attendance?.checkIn && attendance.checkOut) {
    const bounds = shiftBounds(date, shiftCode);
    regularMinutes = Math.max(0, Math.round((Math.min(attendance.checkOut, bounds.end) - Math.max(attendance.checkIn, bounds.start)) / MINUTE));
    state = "CONFIRMED";
  } else if (attendance?.status === "PRESENT" && attendance.confirmedAt) {
    regularMinutes = planned;
    state = "CONFIRMED";
  } else if (attendance?.checkIn) {
    state = "OPEN";
  }

  const overtimeMinutes = input.overtimes
    .filter((item) => Boolean(item.attendanceConfirmedAt))
    .reduce((sum, item) => sum + item.totalMinutes, 0);
  const adjustmentMinutes = input.adjustments
    .filter((item) => item.status === "APPROVED" || item.status === "DONE")
    .reduce((sum, item) => sum + Math.round(item.hours * 60), 0);

  return {
    regularMinutes,
    overtimeMinutes,
    adjustmentMinutes,
    totalMinutes: regularMinutes + overtimeMinutes + adjustmentMinutes,
    state,
  };
}
