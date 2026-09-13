import { BUSINESS_SHIFT_RULES, cleanShiftCode } from "./business-shifts.ts";
import type { BusinessShiftCode } from "./types.ts";

export interface PersonnelShiftDefinition {
  code: BusinessShiftCode;
  label: string;
  startTime: string;
  endTime: string;
  kind: "WORK" | "LEAVE";
  plannedMinutes: number;
}

function durationMinutes(startTime: string, endTime: string): number {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return end >= start ? end - start : 24 * 60 - start + end;
}

export const SHIFT_CATALOG: PersonnelShiftDefinition[] = Object.entries(BUSINESS_SHIFT_RULES).map(([code, rule]) => ({
  code: code as BusinessShiftCode,
  label: rule.label,
  startTime: rule.startTime,
  endTime: rule.endTime,
  kind: rule.working && !rule.dayOff ? "WORK" : "LEAVE",
  plannedMinutes: rule.working && !rule.dayOff ? durationMinutes(rule.startTime, rule.endTime) : 0,
}));

export function normalizeShiftCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function catalogByCode(code: string): PersonnelShiftDefinition | undefined {
  const cleaned = cleanShiftCode(normalizeShiftCode(code));
  return cleaned ? SHIFT_CATALOG.find((shift) => shift.code === cleaned) : undefined;
}
