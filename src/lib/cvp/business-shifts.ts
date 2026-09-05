import type { BusinessShiftCode, ScheduleAdjustment, Shift, WorkSchedule } from "./types.ts";

export const BUSINESS_SHIFT_RULES: Record<BusinessShiftCode, { label: string; startTime: string; endTime: string; dayOff: boolean; working: boolean }> = {
  M: { label: "Ca sáng", startTime: "06:00", endTime: "14:00", dayOff: false, working: true },
  M1: { label: "Ca hành chính", startTime: "08:00", endTime: "17:00", dayOff: false, working: true },
  X5: { label: "Ca 07:00–16:00", startTime: "07:00", endTime: "16:00", dayOff: false, working: true },
  X: { label: "Ca 08:00–17:00", startTime: "08:00", endTime: "17:00", dayOff: false, working: true },
  X3: { label: "Ca 09:00–18:00", startTime: "09:00", endTime: "18:00", dayOff: false, working: true },
  A: { label: "Ca chiều", startTime: "14:00", endTime: "22:00", dayOff: false, working: true },
  D: { label: "Ca đêm", startTime: "22:00", endTime: "06:00", dayOff: false, working: true },
  SM: { label: "Ngày nghỉ 06:00–14:00", startTime: "06:00", endTime: "14:00", dayOff: true, working: true },
  SM1: { label: "Ngày nghỉ 06:00–15:00", startTime: "06:00", endTime: "15:00", dayOff: true, working: true },
  S: { label: "Ngày nghỉ 08:00–17:00", startTime: "08:00", endTime: "17:00", dayOff: true, working: true },
  SA: { label: "Ngày nghỉ 14:00–22:00", startTime: "14:00", endTime: "22:00", dayOff: true, working: true },
  E: { label: "Đêm ngày nghỉ", startTime: "22:00", endTime: "06:00", dayOff: true, working: true },
  P: { label: "Nghỉ phép", startTime: "00:00", endTime: "00:00", dayOff: false, working: false },
  CK: { label: "Nghỉ nghĩa vụ", startTime: "00:00", endTime: "00:00", dayOff: false, working: false },
  RO: { label: "Nghỉ không lý do", startTime: "00:00", endTime: "00:00", dayOff: false, working: false },
  TS: { label: "Nghỉ thai sản", startTime: "00:00", endTime: "00:00", dayOff: false, working: false },
  O: { label: "Nghỉ ốm", startTime: "00:00", endTime: "00:00", dayOff: false, working: false },
};

export function cleanShiftCode(value: unknown): BusinessShiftCode | null {
  const code = String(value ?? "").trim().replace(/^,+/, "").toUpperCase() as BusinessShiftCode;
  return code in BUSINESS_SHIFT_RULES ? code : null;
}

export function scheduleMatchesManagerShift(code: BusinessShiftCode, shift?: Shift | null): boolean {
  if (!shift || !BUSINESS_SHIFT_RULES[code].working) return false;
  if (shift.order === 1) return code === "M" || code === "SM";
  if (shift.order === 2) return code === "M1" || code === "SM1" || code === "S";
  if (shift.order === 3) return code === "X5";
  if (shift.order === 4) return code === "X";
  if (shift.order === 5) return code === "X3";
  if (shift.order === 6) return code === "A" || code === "SA";
  if (shift.order === 7) return code === "D" || code === "E";
  const rule = BUSINESS_SHIFT_RULES[code];
  return rule.startTime === shift.startTime && rule.endTime === shift.endTime;
}

export function effectiveShiftCode(
  schedule: WorkSchedule | undefined,
  adjustments: ScheduleAdjustment[],
): BusinessShiftCode | null {
  if (!schedule) return null;
  return adjustments
    .filter((item) => item.employeeId === schedule.employeeId && item.date === schedule.date && item.status === "ACTIVE")
    .sort((a, b) => b.createdAt - a.createdAt)[0]?.adjustedShiftCode ?? schedule.shiftCode;
}
