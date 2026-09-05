import assert from "node:assert/strict";
import test from "node:test";
import { calculateEmployeeAmh, plannedMinutesForShift } from "./amh.ts";
import type { Amh, Attendance, Overtime } from "./types.ts";

test("tính đúng thời lượng bảy ca quản lý, gồm M1 06:00-15:00", () => {
  assert.deepEqual(
    ["M", "M1", "X5", "X", "X3", "A", "D"].map((code) => plannedMinutesForShift(code as never)),
    [480, 540, 540, 540, 540, 480, 480],
  );
});

test("AMH chỉ cộng OT đã xác nhận và điều chỉnh đã duyệt", () => {
  const attendance = { status: "PRESENT", confirmedAt: 1 } as Attendance;
  const overtimes = [
    { totalMinutes: 90, attendanceConfirmedAt: 1 },
    { totalMinutes: 120 },
  ] as Overtime[];
  const adjustments = [
    { hours: 0.5, status: "APPROVED" },
    { hours: 2, status: "DECLARED" },
  ] as Amh[];
  const result = calculateEmployeeAmh({ date: "2026-09-05", shiftCode: "M1", attendance, overtimes, adjustments });
  assert.equal(result.regularMinutes, 540);
  assert.equal(result.overtimeMinutes, 90);
  assert.equal(result.adjustmentMinutes, 30);
  assert.equal(result.totalMinutes, 660);
});

test("nghỉ không có giờ ca nhưng vẫn giữ OT đã xác nhận", () => {
  const result = calculateEmployeeAmh({
    date: "2026-09-05",
    shiftCode: "D",
    attendance: { status: "ABSENT" } as Attendance,
    overtimes: [{ totalMinutes: 60, attendanceConfirmedAt: 1 } as Overtime],
    adjustments: [],
  });
  assert.equal(result.regularMinutes, 0);
  assert.equal(result.totalMinutes, 60);
  assert.equal(result.state, "ABSENT");
});
