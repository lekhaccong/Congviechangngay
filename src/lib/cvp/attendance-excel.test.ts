import assert from "node:assert/strict";
import test from "node:test";
import { payrollStats } from "./attendance-excel.ts";

test("payrollStats separates day/night work and confirmed OT", () => {
  const schedules = [
    { id: "s1", employeeId: "e1", date: "2026-09-01", shiftCode: "X", source: "TEST", createdAt: 1, updatedAt: 1 },
    { id: "s2", employeeId: "e1", date: "2026-09-02", shiftCode: "D", source: "TEST", createdAt: 1, updatedAt: 1 },
    { id: "s3", employeeId: "e1", date: "2026-09-03", shiftCode: "P", source: "TEST", createdAt: 1, updatedAt: 1 },
  ] as const;
  const attendance = [
    { id: "a1", employeeId: "e1", date: "2026-09-01", shiftId: "x", checkIn: null, checkOut: null, status: "LATE", otMinutes: 0, note: "", actualShiftCode: "X", lateMinutes: 12, confirmedAt: 1, createdAt: 1 },
    { id: "a2", employeeId: "e1", date: "2026-09-02", shiftId: "d", checkIn: null, checkOut: null, status: "PRESENT", otMinutes: 0, note: "", actualShiftCode: "D", confirmedAt: 1, createdAt: 1 },
  ] as const;
  const overtimes = [{ id: "o1", employeeId: "e1", date: "2026-09-01", shiftId: "x", startTime: "17:00", endTime: "19:00", totalMinutes: 120, type: "Ngày thường", note: "", attendanceConfirmedAt: 1, createdAt: 1 }];
  const result = payrollStats("e1", schedules as never, attendance as never, overtimes as never);
  assert.deepEqual(result, { dayWork: 1, nightWork: 1, leave: 1, otDay: 2, otNight: 0, lateMinutes: 12 });
});
