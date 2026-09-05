import test from "node:test";
import assert from "node:assert/strict";
import { effectiveShiftCode, scheduleMatchesManagerShift } from "./business-shifts.ts";
import type { ScheduleAdjustment, Shift, WorkSchedule } from "./types.ts";

const schedule: WorkSchedule = { id: "s1", employeeId: "e1", date: "2026-09-04", shiftCode: "M", source: "Excel", createdAt: 1, updatedAt: 1 };
const managerShift: Shift = { id: "shift-3", name: "A", startTime: "14:00", endTime: "22:00", crossesMidnight: false, order: 6 };

test("lịch thực tế ưu tiên điều chỉnh đang áp dụng", () => {
  const adjustment: ScheduleAdjustment = { id: "a1", batchId: "b1", date: schedule.date, employeeId: schedule.employeeId, originalShiftCode: "M", adjustedShiftCode: "A", kind: "CHANGE", reason: "Thay ca", status: "ACTIVE", createdBy: "Leader", createdAt: 2, revertedAt: null };
  assert.equal(effectiveShiftCode(schedule, [adjustment]), "A");
  assert.equal(scheduleMatchesManagerShift("A", managerShift), true);
});

test("hoàn tác trả nhân sự về lịch Excel gốc", () => {
  const adjustment: ScheduleAdjustment = { id: "a1", batchId: "b1", date: schedule.date, employeeId: schedule.employeeId, originalShiftCode: "M", adjustedShiftCode: "A", kind: "CHANGE", reason: "Thay ca", status: "REVERTED", createdBy: "Leader", createdAt: 2, revertedAt: 3 };
  assert.equal(effectiveShiftCode(schedule, [adjustment]), "M");
});

test("bảy ca quản lý khớp riêng theo đúng thứ tự", () => {
  const definitions: Shift[] = [
    { id: "shift-1", name: "M", startTime: "06:00", endTime: "14:00", crossesMidnight: false, order: 1 },
    { id: "shift-2", name: "M1", startTime: "08:00", endTime: "17:00", crossesMidnight: false, order: 2 },
    { id: "shift-x5", name: "X5", startTime: "07:00", endTime: "16:00", crossesMidnight: false, order: 3 },
    { id: "shift-x", name: "X", startTime: "08:00", endTime: "17:00", crossesMidnight: false, order: 4 },
    { id: "shift-x3", name: "X3", startTime: "09:00", endTime: "18:00", crossesMidnight: false, order: 5 },
    managerShift,
    { id: "shift-4", name: "D", startTime: "22:00", endTime: "06:00", crossesMidnight: true, order: 7 },
  ];
  for (const [index, code] of (["M", "M1", "X5", "X", "X3", "A", "D"] as const).entries()) {
    assert.equal(scheduleMatchesManagerShift(code, definitions[index]), true);
  }
  assert.equal(scheduleMatchesManagerShift("X", definitions[1]), false);
  assert.equal(scheduleMatchesManagerShift("P", definitions[1]), false);
});
