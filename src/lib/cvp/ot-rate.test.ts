import assert from "node:assert/strict";
import test from "node:test";
import { computeOtRate } from "./ot-rate.ts";

test("OT ngày thường ban ngày là 150%", () => assert.equal(computeOtRate("2026-09-04", "17:00", "20:00", "X").ratePercent, 150));
test("OT ngày thường ban đêm là 215%", () => assert.equal(computeOtRate("2026-09-04", "22:00", "01:00", "D").ratePercent, 215));
test("OT ngày nghỉ cá nhân ban ngày là 200%", () => assert.equal(computeOtRate("2026-09-04", "06:00", "14:00", "SM").ratePercent, 200));
test("OT đêm ngày nghỉ là 280%", () => assert.equal(computeOtRate("2026-09-04", "22:00", "06:00", "E").ratePercent, 280));
test("OT Chủ nhật ban đêm là 280%", () => assert.equal(computeOtRate("2026-09-06", "22:00", "02:00", "D").ratePercent, 280));
