import JSZip from "jszip";
import { getDb } from "./db";
import { createEmployee, createOvertime, upsertDataItem, upsertGoods, writeAudit } from "./repo";
import type { DataStatus, Employee, GoodsStatus, Group, Shift } from "./types";

export type ExcelImportKind = "people" | "data" | "export" | "ot";
type Cell = string | number | Date | null;
type Sheet = { name: string; rows: Cell[][] };

export type PersonImportRow = { code: string; name: string; position: string; phone: string };
export type DataImportRow = { productCode: string; designCode: string; invoice: string; lot: string; quantity: number; receivedAt: number; status: DataStatus; note: string };
export type ExportImportRow = { productCode: string; itemCode: string; invoice: string; lot: string; quantity: number; exportDate: string; note: string };
export type OtImportRow = { code: string; name: string; startTime: string; endTime: string; type: string; note: string; date: string | null };
export type ImportRow = PersonImportRow | DataImportRow | ExportImportRow | OtImportRow;
export type ImportPreview = { sheetName: string; rows: ImportRow[]; skipped: number; warnings: string[] };

const text = (value: Cell | undefined) => value instanceof Date ? value.toLocaleDateString("en-CA") : String(value ?? "").trim();
const normalized = (value: Cell | undefined) => text(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const numberValue = (value: Cell | undefined) => Number(String(value ?? "").replace(/[,\s]/g, "")) || 0;
const codeValue = (value: Cell | undefined) => {
  const raw = text(value);
  return /^\d+$/.test(raw) ? raw.padStart(5, "0") : raw;
};

function toDate(value: Cell | undefined, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toLocaleDateString("en-CA");
  const raw = text(value);
  const ymd = raw.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]!.padStart(2, "0")}-${ymd[3]!.padStart(2, "0")}`;
  const dmy = raw.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) return `${dmy[3]!.length === 2 ? `20${dmy[3]}` : dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
  return fallback;
}

function colIndex(ref: string): number {
  let out = 0;
  for (const char of ref.replace(/\d/g, "")) out = out * 26 + char.charCodeAt(0) - 64;
  return out - 1;
}

function excelDate(serial: number): Date {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
}

async function readWorkbook(file: File): Promise<Sheet[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = async (path: string) => zip.file(path)?.async("text") ?? "";
  const parse = (source: string) => new DOMParser().parseFromString(source, "application/xml");
  const sharedDoc = parse(await xml("xl/sharedStrings.xml"));
  const shared = Array.from(sharedDoc.getElementsByTagName("si")).map((node) => Array.from(node.getElementsByTagName("t")).map((t) => t.textContent ?? "").join(""));
  const stylesDoc = parse(await xml("xl/styles.xml"));
  const customFormats = new Map(Array.from(stylesDoc.getElementsByTagName("numFmt")).map((n) => [Number(n.getAttribute("numFmtId")), n.getAttribute("formatCode") ?? ""]));
  const xfs = Array.from(stylesDoc.getElementsByTagName("cellXfs")[0]?.getElementsByTagName("xf") ?? []).map((n) => Number(n.getAttribute("numFmtId") ?? 0));
  const isDateFormat = (style: number) => {
    const id = xfs[style] ?? 0;
    return [14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47].includes(id) || /[dmy]/i.test(customFormats.get(id) ?? "");
  };
  const wb = parse(await xml("xl/workbook.xml"));
  const relDoc = parse(await xml("xl/_rels/workbook.xml.rels"));
  const relationships = new Map(Array.from(relDoc.getElementsByTagName("Relationship")).map((n) => [n.getAttribute("Id") ?? "", n.getAttribute("Target") ?? ""]));
  const result: Sheet[] = [];
  for (const node of Array.from(wb.getElementsByTagName("sheet"))) {
    const target = relationships.get(node.getAttribute("r:id") ?? "") ?? "";
    const path = target.startsWith("/") ? target.slice(1) : target.startsWith("xl/") ? target : `xl/${target.replace(/^\.\//, "")}`;
    const doc = parse(await xml(path));
    const rows: Cell[][] = [];
    for (const row of Array.from(doc.getElementsByTagName("row"))) {
      const rowIndex = Number(row.getAttribute("r") ?? 1) - 1;
      const cells: Cell[] = rows[rowIndex] ?? [];
      for (const cell of Array.from(row.getElementsByTagName("c"))) {
        const index = colIndex(cell.getAttribute("r") ?? "A1");
        const type = cell.getAttribute("t");
        const raw = cell.getElementsByTagName("v")[0]?.textContent ?? "";
        const inline = Array.from(cell.getElementsByTagName("t")).map((t) => t.textContent ?? "").join("");
        const value: Cell = type === "s" ? (shared[Number(raw)] ?? "") : type === "inlineStr" ? inline : type === "b" ? (raw === "1" ? "Có" : "Không") : raw === "" ? null : isDateFormat(Number(cell.getAttribute("s") ?? 0)) ? excelDate(Number(raw)) : Number.isFinite(Number(raw)) ? Number(raw) : raw;
        cells[index] = value;
      }
      rows[rowIndex] = cells;
    }
    result.push({ name: node.getAttribute("name") ?? "Sheet", rows });
  }
  return result;
}

function chooseSheet(sheets: Sheet[], kind: ExcelImportKind): Sheet | undefined {
  const targets: Record<ExcelImportKind, string[]> = { people: ["lich lam viec"], ot: ["lam them"], data: ["shohindata"], export: ["ke hoach"] };
  return sheets.find((sheet) => targets[kind].some((target) => normalized(sheet.name).includes(target))) ?? sheets[0];
}

function headerRow(sheet: Sheet, required: string[]): number {
  return sheet.rows.slice(0, 35).findIndex((row) => required.every((term) => row.some((cell) => normalized(cell).includes(term))));
}

function findColumn(row: Cell[], aliases: string[]): number {
  return row.findIndex((cell) => aliases.some((alias) => normalized(cell).includes(alias)));
}

function statusFrom(value: Cell | undefined): DataStatus {
  const status = normalized(value);
  if (status.includes("hoan thanh") || status === "ok") return "COMPLETED";
  if (status.includes("gui") || status.includes("giao")) return "PUSHED";
  if (status.includes("thieu") || status.includes("chua")) return "MISSING";
  if (status.includes("xu ly")) return "PROCESSING";
  return "NEW";
}

function parseTime(value: Cell | undefined): { startTime: string; endTime: string; type: string } | null {
  const raw = text(value);
  const match = raw.match(/(\d{1,2})\s*(?:h|:)\s*[-–—]\s*(\d{1,2})\s*(?:h|:)?/i);
  if (!match) return null;
  return { startTime: `${match[1]!.padStart(2, "0")}:00`, endTime: `${match[2]!.padStart(2, "0")}:00`, type: raw.replace(/\(.+?\)/, "").trim() || "OT Excel" };
}

export async function previewExcelImport(file: File, kind: ExcelImportKind, fallbackDate: string): Promise<ImportPreview> {
  const sheet = chooseSheet(await readWorkbook(file), kind);
  if (!sheet) throw new Error("Không tìm thấy sheet trong file Excel");
  const required = kind === "people" ? ["sbd", "ho"] : kind === "ot" ? ["sbd", "ca"] : kind === "data" ? ["ma san pham"] : ["invoice"];
  const headerIndex = headerRow(sheet, required);
  if (headerIndex < 0) throw new Error("Không nhận diện được dòng tiêu đề. Hãy dùng mẫu Excel đã cung cấp.");
  const headers = sheet.rows[headerIndex] ?? [];
  const column = (...aliases: string[]) => findColumn(headers, aliases);
  const code = column("sbd", "ma nhan vien"); const name = column("ho va ten", "ho ten");
  const product = column("ma san pham", "ma hang"); const design = column("thiet ke"); const invoice = column("invoice", "invoi", "san pham co the xuat");
  const lot = column("case no", "lot", "so lo"); const quantity = column("so kien", "so luong", "tong", "so luong acs"); const planDate = column("ngay pc", "ngay xuat", "ngay giao");
  const factory = column("nha may"); const status = column("tinh trang data", "tinh trang"); const actualDate = column("thuc te", "nhan qa"); const work = column("cong viec"); const shift = column("ca gio", "ca ");
  const position = column("vi tri"); const phone = column("dien thoai");
  const rows: ImportRow[] = []; let skipped = 0; const warnings: string[] = [];
  for (const row of sheet.rows.slice(headerIndex + 1)) {
    if (!row?.some((cell) => text(cell))) continue;
    if (factory >= 0 && text(row[factory]) && normalized(row[factory]) !== "e") continue;
    if (kind === "people") {
      const employeeCode = codeValue(row[code]); const employeeName = text(row[name]);
      if (!employeeCode || !employeeName) { skipped++; continue; }
      rows.push({ code: employeeCode, name: employeeName, position: text(row[position]), phone: text(row[phone]) });
    } else if (kind === "ot") {
      const employeeCode = codeValue(row[code]); const timing = parseTime(row[shift >= 0 ? shift : work]);
      if (!employeeCode || !timing) { skipped++; continue; }
      rows.push({ code: employeeCode, name: text(row[name]), ...timing, note: text(row[work]), date: null });
    } else if (kind === "data") {
      const productCode = text(row[product]);
      if (!productCode) { skipped++; continue; }
      const inv = text(row[invoice]);
      rows.push({ productCode, designCode: text(row[design]), invoice: inv, lot: text(row[lot]) || text(row[design]) || inv, quantity: numberValue(row[quantity]), receivedAt: new Date(`${toDate(row[actualDate >= 0 ? actualDate : planDate], fallbackDate)}T00:00:00`).getTime(), status: statusFrom(row[status]), note: `Nhập Excel${factory >= 0 ? ` · NM ${text(row[factory])}` : ""}` });
    } else {
      const productCode = text(row[product]) || text(row[invoice]);
      let inv = text(row[invoice]);
      if (invoice >= 0 && text(row[invoice + 1]) && !text(row[invoice + 1]).match(/[a-z]/i)) inv += text(row[invoice + 1]);
      if (!productCode || !inv) { skipped++; continue; }
      rows.push({ productCode, itemCode: text(row[design]) || productCode, invoice: inv, lot: text(row[lot]) || text(row[design]) || inv, quantity: numberValue(row[quantity]), exportDate: toDate(row[planDate], fallbackDate), note: `Nhập kế hoạch Excel${factory >= 0 ? ` · NM ${text(row[factory])}` : ""}` });
    }
  }
  if (!rows.length) warnings.push("Không có dòng hợp lệ để nhập; hãy kiểm tra sheet và nhà máy E.");
  return { sheetName: sheet.name, rows, skipped, warnings };
}

export async function importPeople(rows: PersonImportRow[], groupId: string, shiftId: string): Promise<{ created: number; updated: number }> {
  const db = getDb(); const existing = await db.employees.toArray(); const byCode = new Map(existing.map((item) => [item.code, item])); let created = 0; let updated = 0;
  for (const row of rows) {
    const old = byCode.get(row.code); const note = [row.position && `Vị trí: ${row.position}`, row.phone && `Điện thoại: ${row.phone}`].filter(Boolean).join(" · ");
    if (old) { await db.employees.update(old.id, { name: row.name, groupId, shiftId, serialNumber: row.code, note, updatedAt: Date.now() }); updated++; }
    else { await createEmployee({ code: row.code, name: row.name, serialNumber: row.code, groupId, shiftId, status: "ACTIVE", role: "USER", note }); created++; }
  }
  await writeAudit({ action: "IMPORT", module: "employees", recordId: "excel", newValue: { created, updated } }); return { created, updated };
}

export async function importData(rows: DataImportRow[]): Promise<{ created: number; updated: number }> {
  const existing = await getDb().dataItems.toArray(); let created = 0; let updated = 0;
  for (const row of rows) { const old = existing.find((item) => item.productCode === row.productCode && item.designCode === row.designCode && item.invoice === row.invoice && item.lot === row.lot); await upsertDataItem({ ...row, id: old?.id }); old ? updated++ : created++; }
  await writeAudit({ action: "IMPORT", module: "dataItems", recordId: "excel", newValue: { created, updated } }); return { created, updated };
}

export async function importExport(rows: ExportImportRow[]): Promise<{ created: number; updated: number }> {
  const existing = await getDb().goodsItems.toArray(); let created = 0; let updated = 0;
  for (const row of rows) { const old = existing.find((item) => item.productCode === row.productCode && item.invoice === row.invoice && item.lot === row.lot && item.exportDate === row.exportDate); await upsertGoods({ ...row, status: "WAITING" as GoodsStatus, id: old?.id }); old ? updated++ : created++; }
  await writeAudit({ action: "IMPORT", module: "goodsItems", recordId: "excel", newValue: { created, updated } }); return { created, updated };
}

export async function importOt(rows: OtImportRow[], employees: Employee[], date: string, shiftId: string): Promise<{ created: number; skipped: number }> {
  const db = getDb(); const existing = await db.overtimes.toArray(); let created = 0; let skipped = 0;
  for (const row of rows) { const employee = employees.find((item) => item.code === row.code); const workDate = row.date ?? date; if (!employee || existing.some((item) => item.employeeId === employee.id && item.date === workDate && item.startTime === row.startTime && item.endTime === row.endTime && item.type === row.type)) { skipped++; continue; } await createOvertime({ employeeId: employee.id, date: workDate, shiftId, startTime: row.startTime, endTime: row.endTime, type: row.type, note: row.note }); created++; }
  await writeAudit({ action: "IMPORT", module: "overtimes", recordId: "excel", newValue: { created, skipped } }); return { created, skipped };
}

export type ImportDialogOptions = { groups: Group[]; shifts: Shift[] };
