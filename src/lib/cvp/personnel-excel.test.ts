import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";
import { buildPersonnelTemplate, padSbd, parseCsv, parseDateHeader, parseExcelBuffer } from "./personnel-excel.ts";
import { catalogByCode } from "./personnel-shifts.ts";

describe("excel personnel template", () => {
  it("pads SBD like 554 → 00554", () => {
    assert.equal(padSbd("554"), "00554");
    assert.equal(padSbd("04985"), "04985");
    assert.equal(padSbd("36498"), "36498");
  });

  it("reads 1/7 headers as 2026-07-01", () => {
    assert.equal(parseDateHeader("1/7", 2026), "2026-07-01");
    assert.equal(parseDateHeader("14/7", 2026), "2026-07-14");
  });

  it("parses the tổ thành phẩm E grid (SBD, vị trí, daily codes, skip Lái xe FEL)", () => {
    const csv = [
      "Lịch làm việc tổ thành phẩm E 2026",
      ",,,,,,Nam (*),Lái xe FEL,T4,T5,T6,T7,CN,T2,T3",
      "STT,SBD,Họ và Tên,Vị trí,Điện thoại,Nam (*),Lái xe FEL,1/7,2/7,3/7,4/7,5/7,6/7,7/7",
      "1,554,Bùi Thanh Long,Chief Leader,0392944244,*,L,M,M,M,M,P,M,M",
      "2,4985,Phạm Văn Quảng,Leader,0928875858,*,,X,X,X,A,D,D,D",
      "3,7213,Lê Khắc Công,Sub-Leader,,*,,D,D,D,D,E,X,X",
      '17,15427,Đặng Thị Kim Thanh,"Cấp nhận hàng",,*,,A,A,A,M1,M1,M1,M1',
    ].join("\n");
    const book = parseCsv(csv, 2026);
    assert.equal(book.people.length, 4);
    const long = book.people.find((p) => p.sbd === "00554");
    assert.ok(long);
    assert.equal(long.name, "Bùi Thanh Long");
    assert.equal(long.position, "Chief Leader");
    assert.equal(long.shiftCode, "M");
    const quang = book.people.find((p) => p.sbd === "04985");
    assert.ok(["X", "D"].includes(quang?.shiftCode ?? ""));
    const kim = book.people.find((p) => p.sbd === "15427");
    assert.equal(kim?.name, "Đặng Thị Kim Thanh");
    const codes = book.roster.filter((r) => r.sbd === "00554").map((r) => r.code);
    assert.deepEqual(codes, ["M", "M", "M", "M", "P", "M", "M"]);
    assert.ok(book.roster.some((r) => r.sbd === "00554" && r.date === "2026-07-01" && r.code === "M"));
    assert.ok(book.roster.some((r) => r.sbd === "00554" && r.date === "2026-07-05" && r.code === "P"));
    assert.ok(!book.unknownCodes.includes("L"));
    assert.ok(!book.unknownCodes.includes("*"));
    for (const r of book.roster) {
      assert.ok(catalogByCode(r.code), `unknown ${r.code}`);
    }
  });

  it("round-trips the generated template", async () => {
    const blob = buildPersonnelTemplate(new Date("2026-07-01T08:00:00"));
    const buf = await blob.arrayBuffer();
    const book = parseExcelBuffer(buf, 2026);
    assert.ok(book.people.length >= 8);
    assert.ok(book.roster.length >= 80);
    const names = book.people.map((p) => p.name);
    assert.ok(names.includes("Nguyễn Văn An"));
    const an = book.people.find((p) => p.sbd === "00001");
    assert.equal(an?.position, "Chief Leader");
    assert.ok(["M", "X", "A", "D", "M1"].includes(an?.shiftCode ?? ""));
    const wb = XLSX.read(buf, { type: "array" });
    assert.ok(wb.SheetNames.includes("Lịch tổ"));
    assert.ok(wb.SheetNames.includes("Mã ca"));
    assert.ok(wb.SheetNames.includes("Hướng dẫn"));
  });
});
