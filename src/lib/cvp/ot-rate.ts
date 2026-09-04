import { BUSINESS_SHIFT_RULES } from "./business-shifts.ts";
import { parseDate, parseHHmm } from "./time.ts";
import type { BusinessShiftCode } from "./types.ts";

export interface OtRateResult {
  ratePercent: number;
  rateLabel: string;
  dayMinutes: number;
  nightMinutes: number;
}

export function computeOtRate(date: string, startTime: string, endTime: string, shiftCode?: BusinessShiftCode | null): OtRateResult {
  const start = parseHHmm(startTime);
  let end = parseHHmm(endTime);
  if (end <= start) end += 24 * 60;
  const personalDayOff = shiftCode ? BUSINESS_SHIFT_RULES[shiftCode].dayOff : false;
  const sunday = parseDate(date).getDay() === 0;
  let dayMinutes = 0;
  let nightMinutes = 0;
  for (let minute = start; minute < end; minute++) {
    const clock = minute % (24 * 60);
    if (clock >= 22 * 60 || clock < 6 * 60) nightMinutes++;
    else dayMinutes++;
  }
  const dayRate = sunday || personalDayOff ? 200 : 150;
  const nightRate = sunday || personalDayOff ? 280 : 215;
  const total = dayMinutes + nightMinutes;
  const ratePercent = total ? Math.round((dayMinutes * dayRate + nightMinutes * nightRate) / total) : dayRate;
  const parts = [dayMinutes ? `Ngày ${dayRate}%` : "", nightMinutes ? `Đêm ${nightRate}%` : ""].filter(Boolean);
  return { ratePercent, rateLabel: parts.join(" + "), dayMinutes, nightMinutes };
}
