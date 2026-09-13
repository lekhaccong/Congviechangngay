import * as XLSX from "xlsx";
import { SHIFT_CATALOG, catalogByCode, normalizeShiftCode } from "./personnel-shifts.ts";

export interface PersonImportRow {
  stt: string;
  sbd: string;
  name: string;
  position: string;
  phone: string;
  group: string;
  shiftCode: string;
  note: string;
}

export interface RosterImportRow {
  sbd: string;
  date: string;
  code: string;
}

export interface PersonnelWorkbook {
  people: PersonImportRow[];
  roster: RosterImportRow[];
  unknownCodes: string[];
  warnings: string[];
  year: number;
}

const NAME_KEYS = ["họ và tên", "ho va ten", "họ tên", "ho ten", "họten", "tên", "ten", "name", "hoten"];
const SBD_KEYS = ["sbd", "số báo danh", "so bao danh", "mã nv", "ma nv", "mã nhân viên", "ma nhan vien", "code", "manv"];
const POS_KEYS = ["vị trí", "vi tri", "chức danh", "chuc danh", "vị trí công việc", "vi tri cong viec", "position", "job"];
const PHONE_KEYS = ["điện thoại", "dien thoai", "sđt", "sdt", "phone", "tel", "di động", "di dong"];
const GROUP_KEYS = ["nhóm", "nhom", "tổ", "to", "group"];
const SHIFT_KEYS = ["ca mặc định", "ca mac dinh", "ca làm việc", "ca lam viec", "ca", "shift"];
const NOTE_KEYS = ["ghi chú", "ghi chu", "note", "ghichu"];
const STT_KEYS = ["stt", "số thứ tự", "so thu tu", "no"];
const DATE_KEYS = ["ngày", "ngay", "date"];
const CODE_KEYS = ["mã ca", "ma ca", "maca", "code ca"];
const SKIP_HEADERS = [
  "nam",
  "nam (*)",
  "lái xe",
  "lai xe",
  "lái xe fel",
  "lai xe fel",
  "lái xe el",
  "lai xe el",
  "fel",
  "el",
];

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[*()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    const d = v.getDate();
    const m = v.getMonth() + 1;
    const y = v.getFullYear();
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof v === "number") return String(v);
  return String(v).trim();
}

function matchKey(header: string, keys: string[]): boolean {
  const h = fold(header);
  return keys.some((k) => h === k || h.replace(/\s/g, "") === k.replace(/\s/g, ""));
}

const DATE_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DATE_DM = /^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/;

export function parseDateHeader(raw: string, year: number): string | null {
  const s = cellStr(raw);
  if (!s) return null;
  const iso = s.match(DATE_ISO);
  if (iso) {
    return `${iso[1]}-${iso[2]!.padStart(2, "0")}-${iso[3]!.padStart(2, "0")}`;
  }
  const dm = s.match(DATE_DM);
  if (dm) {
    const day = Number(dm[1]);
    const month = Number(dm[2]);
    let y = dm[3] ? Number(dm[3]) : year;
    if (y < 100) y += 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function detectYear(grids: string[][][]): number {
  for (const grid of grids) {
    for (const row of grid.slice(0, 4)) {
      for (const c of row) {
        const m = c.match(/(20\d{2})/);
        if (m) return Number(m[1]);
      }
    }
  }
  return new Date().getFullYear();
}

function findHeaderRow(grid: string[][]): number {
  const max = Math.min(grid.length, 8);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < max; i++) {
    const row = grid[i] ?? [];
    let score = 0;
    for (const cell of row) {
      if (matchKey(cell, SBD_KEYS)) score += 5;
      if (matchKey(cell, NAME_KEYS)) score += 5;
      if (matchKey(cell, POS_KEYS)) score += 2;
      if (parseDateHeader(cell, 2026)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return bestScore > 0 ? best : 0;
}

function mapCols(headers: string[]) {
  const idx = {
    sbd: -1,
    name: -1,
    position: -1,
    phone: -1,
    group: -1,
    shift: -1,
    note: -1,
    stt: -1,
    date: -1,
    code: -1,
    dates: [] as { i: number; iso: string }[],
  };
  headers.forEach((h, i) => {
    if (matchKey(h, SKIP_HEADERS)) return;
    if (idx.sbd < 0 && matchKey(h, SBD_KEYS)) idx.sbd = i;
    else if (idx.name < 0 && matchKey(h, NAME_KEYS)) idx.name = i;
    else if (idx.position < 0 && matchKey(h, POS_KEYS)) idx.position = i;
    else if (idx.phone < 0 && matchKey(h, PHONE_KEYS)) idx.phone = i;
    else if (idx.group < 0 && matchKey(h, GROUP_KEYS)) idx.group = i;
    else if (idx.shift < 0 && matchKey(h, SHIFT_KEYS)) idx.shift = i;
    else if (idx.note < 0 && matchKey(h, NOTE_KEYS)) idx.note = i;
    else if (idx.stt < 0 && matchKey(h, STT_KEYS)) idx.stt = i;
    else if (idx.date < 0 && matchKey(h, DATE_KEYS)) idx.date = i;
    else if (idx.code < 0 && matchKey(h, CODE_KEYS)) idx.code = i;
  });
  return idx;
}

export function padSbd(raw: string): string {
  const s = raw.trim();
  if (/^\d+$/.test(s) && s.length < 5) return s.padStart(5, "0");
  return s;
}

function parseGrid(grid: string[][], year: number, into: PersonnelWorkbook): void {
  if (grid.length === 0) return;
  const headerIndex = findHeaderRow(grid);
  const headers = grid[headerIndex] ?? [];
  const cols = mapCols(headers);
  headers.forEach((h, i) => {
    if (matchKey(h, SKIP_HEADERS)) return;
    if (
      [cols.sbd, cols.name, cols.position, cols.phone, cols.group, cols.shift, cols.note, cols.stt, cols.date, cols.code].includes(
        i,
      )
    ) {
      return;
    }
    const iso = parseDateHeader(h, year);
    if (iso) cols.dates.push({ i, iso });
  });

  const isRosterTall = cols.sbd >= 0 && cols.date >= 0 && cols.code >= 0 && cols.name < 0;
  const isPeople = cols.sbd >= 0 || cols.name >= 0;
  if (!isPeople && !isRosterTall) return;

  for (let r = headerIndex + 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const sbd = padSbd(cols.sbd >= 0 ? cellStr(row[cols.sbd]) : "");
    const name = cols.name >= 0 ? cellStr(row[cols.name]) : "";
    if (!sbd && !name) continue;
    if (/^stt$/i.test(sbd) || fold(name) === "ho va ten") continue;

    if (isRosterTall) {
      const date = parseDateHeader(cellStr(row[cols.date]), year);
      const code = normalizeShiftCode(cellStr(row[cols.code]));
      if (sbd && date && code) {
        into.roster.push({ sbd, date, code });
        if (!catalogByCode(code)) into.unknownCodes.push(code);
      }
      continue;
    }

    const shiftRaw = cols.shift >= 0 ? cellStr(row[cols.shift]) : "";
    const shiftCode = shiftRaw ? normalizeShiftCode(shiftRaw.split(/\s/)[0] ?? "") : "";
    if (name || sbd) {
      into.people.push({
        stt: cols.stt >= 0 ? cellStr(row[cols.stt]) : "",
        sbd: sbd || name,
        name: name || sbd,
        position: cols.position >= 0 ? cellStr(row[cols.position]) : "",
        phone: cols.phone >= 0 ? cellStr(row[cols.phone]) : "",
        group: cols.group >= 0 ? cellStr(row[cols.group]) : "",
        shiftCode,
        note: cols.note >= 0 ? cellStr(row[cols.note]) : "",
      });
      if (shiftCode && !catalogByCode(shiftCode)) into.unknownCodes.push(shiftCode);
    }

    if (sbd && cols.dates.length) {
      for (const d of cols.dates) {
        const code = normalizeShiftCode(cellStr(row[d.i]));
        if (!code) continue;
        into.roster.push({ sbd, date: d.iso, code });
        if (!catalogByCode(code)) into.unknownCodes.push(code);
      }
    }
  }
}

export function parseCsv(text: string, year?: number): PersonnelWorkbook {
  // Giữ nguyên tiêu đề 1/7, 2/7...; nếu để SheetJS tự định dạng,
  // "1/7" có thể bị biến thành năm 2001 và làm lệch toàn bộ lịch.
  const wb = XLSX.read(text, { type: "string", raw: true });
  return parseWorkbook(wb, year);
}

export function parseExcelBuffer(data: ArrayBuffer, year?: number): PersonnelWorkbook {
  const wb = XLSX.read(data, { type: "array", cellDates: true, raw: false });
  return parseWorkbook(wb, year);
}

function sheetToGrid(ws: XLSX.WorkSheet): string[][] {
  const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });
  return rows.map((row) => (row ?? []).map((c) => cellStr(c)));
}

function inferDefaultShifts(into: PersonnelWorkbook) {
  for (const p of into.people) {
    if (p.shiftCode && catalogByCode(p.shiftCode)?.kind === "WORK") continue;
    const key = p.sbd.toUpperCase();
    const codes = into.roster
      .filter((r) => r.sbd.toUpperCase() === key)
      .map((r) => r.code)
      .filter((c) => catalogByCode(c)?.kind === "WORK");
    if (!codes.length) continue;
    const freq = new Map<string, number>();
    for (const c of codes) freq.set(c, (freq.get(c) ?? 0) + 1);
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) p.shiftCode = top[0];
  }
}

function parseWorkbook(wb: XLSX.WorkBook, yearHint?: number): PersonnelWorkbook {
  const grids = wb.SheetNames.map((n) => sheetToGrid(wb.Sheets[n]!));
  const year = yearHint ?? detectYear(grids);
  const into: PersonnelWorkbook = {
    people: [],
    roster: [],
    unknownCodes: [],
    warnings: [],
    year,
  };
  for (const grid of grids) parseGrid(grid, year, into);

  const seenPeople = new Map<string, PersonImportRow>();
  for (const p of into.people) {
    const key = p.sbd || p.name;
    const prev = seenPeople.get(key);
    if (prev) {
      seenPeople.set(key, {
        ...prev,
        ...p,
        name: p.name || prev.name,
        position: p.position || prev.position,
        phone: p.phone || prev.phone,
        shiftCode: p.shiftCode || prev.shiftCode,
      });
    } else seenPeople.set(key, p);
  }
  into.people = [...seenPeople.values()];
  inferDefaultShifts(into);
  into.unknownCodes = [...new Set(into.unknownCodes.filter(Boolean))];
  if (into.people.length === 0) into.warnings.push("Không thấy cột SBD / Họ và tên.");
  return into;
}

function weekdayVi(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()] ?? "";
}

/** File mẫu khớp lịch tổ thành phẩm E: STT · SBD · Họ tên · Vị trí · ca theo ngày. */
export function buildPersonnelTemplate(now = new Date()): Blob {
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  const days = 14;
  const dateHeaders: string[] = [];
  const weekdays: string[] = [];
  const isos: string[] = [];
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    isos.push(iso);
    dateHeaders.push(`${d}/${month}`);
    weekdays.push(weekdayVi(iso));
  }

  const peopleHeader = ["STT", "SBD", "Họ và Tên", "Vị trí công việc", "Điện thoại", "Nhóm", "Ca mặc định", "Giờ bắt đầu", "Giờ kết thúc", "Ghi chú"];
  const peopleRows = [
    peopleHeader,
    ["1", "00001", "Nguyễn Văn An", "Chief Leader", "", "Tổ thành phẩm E", "M", "06:00", "14:00", "Ví dụ — xóa dòng này rồi dán tổ thật"],
    ["2", "00002", "Trần Thị Bình", "Leader", "", "Tổ thành phẩm E", "X", "08:00", "17:00", ""],
    ["3", "00003", "Lê Văn Cường", "Sub-Leader", "", "Tổ thành phẩm E", "A", "14:00", "22:00", ""],
    ["4", "00004", "Phạm Thị Dung", "Trainer I", "", "Tổ thành phẩm E", "M1", "06:00", "15:00", ""],
    ["5", "00005", "Hoàng Văn Em", "Đóng Cont,IGHS", "", "Tổ thành phẩm E", "X", "08:00", "17:00", ""],
    ["6", "00006", "Võ Thị Phương", "Lái Xe,IGHS", "", "Tổ thành phẩm E", "A", "14:00", "22:00", ""],
    ["7", "00007", "Đặng Văn Giang", "Cấp,nhận hàng", "", "Tổ thành phẩm E", "X", "08:00", "17:00", ""],
    ["8", "00008", "Bùi Thị Hoa", "IGHS", "", "Tổ thành phẩm E", "D", "22:00", "06:00", "Ca đêm qua ngày"],
  ];

  const padLeft = ["", "", "", "", "", "Nam (*)", "Lái xe FEL"];
  const wideHeader = ["STT", "SBD", "Họ và Tên", "Vị trí", "Điện thoại", "Nam (*)", "Lái xe FEL", ...dateHeaders];
  const wide = [
    [`Lịch làm việc tổ thành phẩm E ${y}`],
    [...padLeft, ...weekdays],
    wideHeader,
    ["1", "00001", "Nguyễn Văn An", "Chief Leader", "", "*", "L", "M", "M", "M", "M", "P", "M", "M", "M", "M", "M", "M", "X", "X", "X"],
    ["2", "00002", "Trần Thị Bình", "Leader", "", "*", "", "X", "X", "X", "A", "S", "X", "X", "X", "X", "X", "M", "X5", "X", "X"],
    ["3", "00003", "Lê Văn Cường", "Sub-Leader", "", "*", "", "D", "D", "D", "D", "E", "X", "X", "X", "X", "X", "X", "M", "M", "M"],
    ["4", "00004", "Phạm Thị Dung", "Trainer I", "", "*", "", "M1", "M1", "M1", "M1", "SM1", "M", "M", "M1", "M", "M", "M", "X", "M", "M"],
    ["5", "00005", "Hoàng Văn Em", "Đóng Cont,IGHS", "", "*", "", "M1", "M1", "M1", "", "D", "D", "D", "D", "D", "D", "D", "A", "A", ""],
    ["6", "00006", "Võ Thị Phương", "Lái Xe,IGHS", "", "*", "L", "X", "X", "X", "X", "S", "A", "X", "A", "A", "X", "M", "X", "X", "M1"],
    ["7", "00007", "Đặng Văn Giang", "Cấp,nhận hàng", "", "*", "", "A", "A", "A", "A", "SA", "M1", "M1", "M1", "M1", "M1", "M1", "M", "M1", "M1"],
    ["8", "00008", "Bùi Thị Hoa", "IGHS", "", "*", "", "D", "D", "D", "D", "E", "A", "A", "A", "A", "A", "A", "A", "M1", "M1"],
    ["9", "00009", "Ngô Văn Ích", "Cấp,nhận hàng", "", "*", "", "O", "O", "O", "M1", "SM1", "X", "X", "X", "X", "X", "X", "M1", "P", ""],
    ["10", "00010", "Lý Thị Kim", "Cấp,nhận hàng", "", "*", "", "M1", "M1", "M1", "M1", "SM1", "M1", "M1", "M1", "M1", "M1", "M1", "M", "M1", "M1"],
  ];

  const codes = [
    ["Mã", "Tên", "Bắt đầu", "Kết thúc", "Loại", "Giờ ca (AMH)", "Dùng cho"],
    ...SHIFT_CATALOG.map((s) => [
      s.code,
      s.label,
      s.startTime,
      s.endTime,
      s.kind === "WORK" ? "Làm" : "Nghỉ",
      s.plannedMinutes / 60,
      s.kind === "WORK" ? "Chấm công · OT · AMH" : "Khai ca nghỉ — AMH 0 giờ ca",
    ]),
  ];

  const guide = [
    ["Hướng dẫn nhập nhanh nhân sự — tổ thành phẩm E"],
    [""],
    ["1. Tải file này. Sheet Lịch tổ giống file Excel đang dùng trên máy tính."],
    ["2. Xóa dòng ví dụ, dán STT / SBD / Họ và Tên / Vị trí / Điện thoại / mã ca từng ngày."],
    ["3. Trong app: Nhân sự → Nhập Excel → xem trước → xác nhận."],
    ["4. Có thể nhập thẳng file lịch tổ sẵn có (cột 1/7, 2/7…). Cột Nam (*) và Lái xe FEL bị bỏ qua."],
    [""],
    ["SBD là khóa. Trùng SBD thì cập nhật, không tạo đôi. Excel để 554 thì app thành 00554."],
    ["Ô ngày trống = chưa xếp ca. Ca mặc định = mã làm nhiều nhất trong lịch."],
    [""],
    ["Ca làm — dùng chấm công, tính muộn, AMH"],
    ["M   06:00–14:00   8 giờ"],
    ["M1  06:00–15:00   9 giờ"],
    ["X5  07:00–16:00   9 giờ"],
    ["X   08:00–17:00   9 giờ"],
    ["X3  09:00–18:00   9 giờ"],
    ["A   14:00–22:00   8 giờ"],
    ["D   22:00–06:00   8 giờ (qua ngày)"],
    [""],
    ["Khai ca nghỉ — không chấm đến, AMH giờ ca = 0"],
    ["SM / SM1 / S / SA / E = ngày nghỉ đúng khung ca tương ứng"],
    ["P = nghỉ phép"],
    ["CK = nghỉ nghĩa vụ"],
    ["RO = nghỉ không lý do"],
    ["TS = nghỉ thai sản"],
    ["O = nghỉ ốm"],
    [""],
    ["Chấm công: tích Đã đến nếu đúng giờ; nếu muộn thì nhập số phút đến sau giờ bắt đầu ca."],
    ["OT = làm thêm ngoài giờ ca. 22:00→01:00 = 3 giờ."],
    ["AMH = giờ ca thực tế đã xác nhận - phút muộn + OT đã xác nhận + điều chỉnh đã duyệt."],
    [""],
    ["Không điền số điện thoại thật vào file mẫu."],
    ...isos.map((d, i) => [`Cột ${dateHeaders[i]} (${weekdays[i]}) = ${d}`]),
  ];

  const wb = XLSX.utils.book_new();
  const wideSheet = XLSX.utils.aoa_to_sheet(wide);
  wideSheet["!cols"] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    ...dateHeaders.map(() => ({ wch: 5 })),
  ];
  const peopleSheet = XLSX.utils.aoa_to_sheet(peopleRows);
  peopleSheet["!cols"] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 13 },
    { wch: 13 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(wb, wideSheet, "Lịch tổ");
  XLSX.utils.book_append_sheet(wb, peopleSheet, "Nhân sự");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(codes), "Mã ca");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(guide), "Hướng dẫn");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export const TEMPLATE_FILENAME = "mau-nhap-nhan-su-to-thanh-pham-E.xlsx";

export function downloadPersonnelTemplate() {
  const blob = buildPersonnelTemplate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = TEMPLATE_FILENAME;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
