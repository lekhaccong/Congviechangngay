import assert from "node:assert/strict";
import test from "node:test";
import { isInPlanningWeek, planningWeek } from "./planning-week.ts";

test("tuần kế hoạch bắt đầu từ thứ Hai", () => {
  assert.deepEqual(planningWeek("2026-09-04"), { start: "2026-08-31", end: "2026-09-06" });
  assert.equal(isInPlanningWeek("2026-08-31", "2026-09-04"), true);
  assert.equal(isInPlanningWeek("2026-09-07", "2026-09-04"), false);
});
