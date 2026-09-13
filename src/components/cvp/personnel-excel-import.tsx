import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  downloadPersonnelTemplate,
  parseCsv,
  parseExcelBuffer,
  type PersonnelWorkbook,
} from "@/lib/cvp/personnel-excel";
import { importPeople } from "@/lib/cvp/excel-import";
import { catalogByCode } from "@/lib/cvp/personnel-shifts";
import { useRows } from "@/lib/cvp/hooks";
import { getDb } from "@/lib/cvp/db";

export function ExcelImportButtons({ layout = "compact" }: { layout?: "compact" | "card" }) {
  const groups = useRows(() => getDb().groups.orderBy("order").toArray());
  const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PersonnelWorkbook | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    try {
      const name = file.name.toLowerCase();
      let book: PersonnelWorkbook;
      if (name.endsWith(".csv") || name.endsWith(".txt")) {
        book = parseCsv(await file.text());
      } else {
        book = parseExcelBuffer(await file.arrayBuffer());
      }
      setPreview(book);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đọc được file");
    }
  }

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".xlsx,.xlsm,.xls,.csv,text/csv"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) void onFile(f);
      }}
    />
  );

  const dialog = (
    <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} title="Xem trước nhập Excel" wide>
      {preview ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {preview.people.length} nhân sự · {preview.roster.length} ô lịch · năm {preview.year}. Trùng
            SBD sẽ cập nhật, không xóa người đang có.
          </p>
          {preview.warnings.length ? <p className="text-sm text-warn">{preview.warnings.join(" ")}</p> : null}
          {preview.unknownCodes.length ? (
            <p className="text-sm text-danger">Mã lạ: {preview.unknownCodes.join(", ")}</p>
          ) : null}
          <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg bg-surface-2 px-3">
            {preview.people.slice(0, 12).map((p) => {
              const def = p.shiftCode ? catalogByCode(p.shiftCode) : undefined;
              return (
                <li key={p.sbd || p.name} className="flex min-h-12 items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted">
                      {p.sbd}
                      {p.position ? ` · ${p.position}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs">
                    {p.shiftCode || "—"}
                    {def ? ` ${def.startTime}–${def.endTime}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          {preview.people.length > 12 ? (
            <p className="text-xs text-muted">… và {preview.people.length - 12} người nữa</p>
          ) : null}
          <Button
            className="w-full"
            disabled={busy || preview.people.length === 0}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await importPeople(
                  preview.people.map((person) => ({
                    code: person.sbd,
                    name: person.name,
                    position: person.position,
                    phone: person.phone,
                    groupName: person.group || person.position,
                  })),
                  groups[0]?.id ?? "",
                  shifts.find((shift) => shift.order === 4)?.id ?? shifts[0]?.id ?? "",
                  preview.roster.map((cell) => ({ code: cell.sbd, date: cell.date, shiftCode: cell.code as import("@/lib/cvp/types").BusinessShiftCode })),
                );
                toast.success(`Thêm ${r.created}, cập nhật ${r.updated}, lịch ${r.scheduled} ô`);
                setPreview(null);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Nhập lỗi");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Đang nhập…" : "Xác nhận nhập"}
          </Button>
        </div>
      ) : null}
    </Dialog>
  );

  if (layout === "card") {
    return (
      <section className="mb-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-medium">Nhập nhanh từ Excel</p>
        <p className="mt-1 text-sm text-muted">
          STT · SBD · Họ và tên · Vị trí · Điện thoại · mã ca từng ngày (M, X, A, D, P, O…). Có thể dán thẳng file lịch tổ
          thành phẩm E.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button className="min-h-12" variant="secondary" onClick={() => downloadPersonnelTemplate()}>
            <FileSpreadsheet className="size-4" />
            Tải mẫu
          </Button>
          <Button className="min-h-12" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Nhập Excel
          </Button>
        </div>
        {fileInput}
        {dialog}
      </section>
    );
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => downloadPersonnelTemplate()}>
        Tải mẫu
      </Button>
      <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
        Nhập Excel
      </Button>
      {fileInput}
      {dialog}
    </>
  );
}
