import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planTaskReminders } from "./notification-plan.ts";
const now = 1_000_000;
const task = { id: "task", name: "Hàng xuất", status: "TODO", deadline: now + 3_600_000, reminderTime: null };
describe("Android reminder plan", () => {
  it("schedules before and at deadline, including overnight timestamps", () => {
    assert.deepEqual(planTaskReminders([task], now).map((r) => r.at), [now + 1_800_000, now + 3_600_000]);
  });
  it("removes completed, deleted, invalid and past reminders", () => {
    assert.deepEqual(planTaskReminders([{ ...task, status: "COMPLETED" }, { ...task, deadline: null }, { ...task, deadline: NaN }, { ...task, deadline: now - 1 }], now), []);
    assert.deepEqual(planTaskReminders([], now), []);
  });
  it("keeps only deadline when advance reminder has passed", () => {
    assert.deepEqual(planTaskReminders([task], now + 2_000_000).map((r) => r.kind), ["due"]);
  });
  it("uses explicit reminder and changed deadline without changing event identity", () => {
    const changed = { ...task, deadline: now + 7_200_000, reminderTime: now + 5_000 };
    assert.equal(planTaskReminders([changed], now)[0].at, now + 5_000);
    assert.equal(planTaskReminders([changed], now)[1].key, planTaskReminders([task], now)[1].key);
  });
});
