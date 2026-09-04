import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import {
  importData,
  importExport,
  importOt,
  importPeople,
  previewExcelImport,
  type ExcelImportKind,
  type ImportPreview,
} from "@/lib/cvp/excel-import";
import type { Employee, Group, Shift } from "@/lib/cvp/types";

const TITLES: Record<ExcelImportKind, string> = { people: "Nhập nhân sự từ Excel", data: "Nhập DATA từ Excel", export: "Nhập kế hoạch xuất hàng", ot: "Nhập OT từ Excel" };

export function ExcelImportDialog({
  open, onClose, kind, date, shiftId, groups = [], shifts = [], employees = [],
}: {
  open: boolean; onClose: () => void; kind: ExcelImportKind; date: string; shiftId: string; groups?: Group[]; shifts?: Shift[]; employees?: Employee[];
}) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [targetShiftId, setTargetShiftId] = useState(shiftId || shifts[0]?.id || "");

  useEffect(() => {
    if (!groupId && groups[0]) setGroupId(groups[0].id);
  }, [groupId, groups]);
  useEffect(() => {
    if (!targetShiftId && (shiftId || shifts[0])) setTargetShiftId(shiftId || shifts[0]!.id);
  }, [shiftId, shifts, targetShiftId]);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setPreview(null);
    try { setPreview(await previewExcelImport(file, kind, date)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không đọc được file Excel"); }
    finally { setLoading(false); event.target.value = ""; }
  };
  const save = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      let result: { created: number; updated?: number; skipped?: number; scheduled?: number };
      if (kind === "people") result = await importPeople(preview.rows as never, groupId, targetShiftId, preview.scheduleRows);
      else if (kind === "data") result = await importData(preview.rows as never);
      else if (kind === "export") result = await importExport(preview.rows as never);
      else result = await importOt(preview.rows as never, employees, date, targetShiftId);
      toast.success(`Đã nhập ${result.created} dòng${result.updated ? `, cập nhật ${result.updated}` : ""}${result.scheduled ? `, ${result.scheduled} lịch ca` : ""}${result.skipped ? `, bỏ qua ${result.skipped}` : ""}`);
      setPreview(null); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể nhập dữ liệu"); }
    finally { setLoading(false); }
  };
  const labels = kind === "people" ? ["SBD", "Họ tên", "Vị trí"] : kind === "ot" ? ["SBD", "Họ tên", "Khung giờ"] : kind === "data" ? ["Mã SP", "Invoice", "Lot"] : ["Mã SP", "Invoice", "Ngày xuất"];
  const values = (row: Record<string, unknown>) => kind === "people" ? [row.code, row.name, row.position] : kind === "ot" ? [row.code, row.name, `${row.startTime}–${row.endTime}`] : kind === "data" ? [row.productCode, row.invoice, row.lot] : [row.productCode, row.invoice, row.exportDate];
  return <Dialog open={open} onClose={onClose} title={TITLES[kind]} wide>
    <div className="space-y-3">
      <p className="text-sm text-muted">Chọn file .xlsx hoặc .xlsm. Hệ thống đọc file ngay trên thiết bị và hiển thị bản xem trước trước khi lưu.</p>
      {kind === "people" ? <div className="grid grid-cols-2 gap-2">
        <Field label="Nhóm nhận dữ liệu"><NativeSelect value={groupId} onChange={(e) => setGroupId(e.target.value)}>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect></Field>
        <Field label="Ca mặc định"><NativeSelect value={targetShiftId} onChange={(e) => setTargetShiftId(e.target.value)}>{shifts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect></Field>
      </div> : null}
      {kind === "ot" ? <Field label="Ca khai OT"><NativeSelect value={targetShiftId} onChange={(e) => setTargetShiftId(e.target.value)}>{shifts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect></Field> : null}
      <Input type="file" accept=".xlsx,.xlsm" onChange={(event) => void chooseFile(event)} disabled={loading} />
      {preview ? <div className="rounded-lg bg-surface-2 p-3 text-sm">
        <p className="font-medium">Sheet: {preview.sheetName} · {preview.rows.length} dòng hợp lệ{preview.scheduleRows?.length ? ` · ${preview.scheduleRows.length} lịch ca` : ""}{preview.skipped ? ` · bỏ qua ${preview.skipped}` : ""}</p>
        {preview.warnings.map((warning) => <p key={warning} className="mt-1 text-danger">{warning}</p>)}
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{labels.map((label) => <th key={label} className="pb-1 pr-3 text-muted">{label}</th>)}</tr></thead><tbody>{preview.rows.slice(0, 5).map((row, index) => <tr key={index}>{values(row as Record<string, unknown>).map((value, valueIndex) => <td key={valueIndex} className="pr-3">{String(value ?? "—")}</td>)}</tr>)}</tbody></table></div>
      </div> : null}
      <Button className="w-full" disabled={!preview?.rows.length || loading || (kind === "people" && (!groupId || !targetShiftId)) || (kind === "ot" && !targetShiftId)} onClick={() => void save()}>{loading ? "Đang xử lý…" : `Nhập ${preview?.rows.length ?? 0} dòng`}</Button>
    </div>
  </Dialog>;
}
