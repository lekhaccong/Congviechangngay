import test from "node:test";
import assert from "node:assert/strict";
import { effectiveShiftCode, scheduleMatchesManagerShift } from "./business-shifts.ts";
import type { ScheduleAdjustment, Shift, WorkSchedule } from "./types.ts";

const schedule: WorkSchedule = { id: "s1", employeeId: "e1", date: "2026-09-04", shiftCode: "M", source: "Excel", createdAt: 1, updatedAt: 1 };
const managerShift: Shift = { id: "shift-3", name: "Ca 3", startTime: "14:00", endTime: "22:00", crossesMidnight: false, order: 3 };

test("lịch thực tế ưu tiên điều chỉnh đang áp dụng", () => {
  const adjustment: ScheduleAdjustment = { id: "a1", batchId: "b1", date: schedule.date, employeeId: schedule.employeeId, originalShiftCode: "M", adjustedShiftCode: "A", kind: "CHANGE", reason: "Thay ca", status: "ACTIVE", createdBy: "Leader", createdAt: 2, revertedAt: null };
  assert.equal(effectiveShiftCode(schedule, [adjustment]), "A");
  assert.equal(scheduleMatchesManagerShift("A", managerShift), true);
});

test("hoàn tác trả nhân sự về lịch Excel gốc", () => {
  const adjustment: ScheduleAdjustment = { id: "a1", batchId: "b1", date: schedule.date, employeeId: schedule.employeeId, originalShiftCode: "M", adjustedShiftCode: "A", kind: "CHANGE", reason: "Thay ca", status: "REVERTED", createdBy: "Leader", createdAt: 2, revertedAt: 3 };
  assert.equal(effectiveShiftCode(schedule, [adjustment]), "M");
});

test("ca hành chính gom đúng các mã lịch ban ngày", () => {
  const shift: Shift = { ...managerShift, id: "shift-2", name: "Ca 2", startTime: "08:00", endTime: "17:00", order: 2 };
  for (const code of ["M1", "X", "X5", "X3", "SM1", "S"] as const) assert.equal(scheduleMatchesManagerShift(code, shift), true);
  assert.equal(scheduleMatchesManagerShift("P", shift), false);
});
