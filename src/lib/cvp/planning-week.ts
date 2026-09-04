import { addDays, parseDate } from "./time.ts";

/** Tuần kế hoạch luôn tính từ thứ Hai đến hết Chủ nhật. */
export function planningWeek(date: string): { start: string; end: string } {
  const day = parseDate(date).getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(date, mondayOffset);
  return { start, end: addDays(start, 6) };
}

export function isInPlanningWeek(candidate: string, selectedDate: string): boolean {
  const { start, end } = planningWeek(selectedDate);
  return candidate >= start && candidate <= end;
}
