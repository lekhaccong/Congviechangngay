import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/cvp/page-header";
import { AttendanceBadge } from "@/components/cvp/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, NativeSelect, Textarea } from "@/components/ui/input";
import { useRows } from "@/lib/cvp/hooks";
import { getDb } from "@/lib/cvp/db";
import { useAppStore } from "@/lib/cvp/store";
import {
  changeSchedule,
  clearAttendanceConfirmation,
  confirmAttendance,
  confirmAttendanceOvertime,
  markAbsent,
  revertScheduleAdjustment,
  swapSchedules,
} from "@/lib/cvp/repo";
import { can } from "@/lib/cvp/permissions";
import { BUSINESS_SHIFT_RULES, effectiveShiftCode, scheduleMatchesManagerShift } from "@/lib/cvp/business-shifts";
import type { BusinessShiftCode } from "@/lib/cvp/types";

export const Route = createFileRoute("/attendance")({ component: AttendancePage });

const SHIFT_CODES = Object.keys(BUSINESS_SHIFT_RULES).filter((code) => code !== "P") as BusinessShiftCode[];
const FALLBACK_BY_ORDER: Record<number, BusinessShiftCode> = { 1: "M", 2: "M1", 3: "A", 4: "D" };

function AttendancePage() {
  const date = useAppStore((s) => s.selectedDate);
  const shiftId = useAppStore((s) => s.selectedShiftId);
  const role = useAppStore((s) => s.role);
  const people = useRows(() => getDb().employees.orderBy("code").toArray());
  const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
  const schedules = useRows(() => getDb().workSchedules.where("date").equals(date).toArray(), [date]);
  const adjustments = useRows(() => getDb().scheduleAdjustments.where("date").equals(date).reverse().sortBy("createdAt"), [date]);
  const rows = useRows(() => getDb().attendance.filter((item) => item.date === date && (!shiftId || item.shiftId === shiftId)).toArray(), [date, shiftId]);
  const ots = useRows(() => getDb().overtimes.where("date").equals(date).toArray(), [date]);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [kind, setKind] = useState<"CHANGE" | "SWAP">("CHANGE");
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [newCode, setNewCode] = useState<BusinessShiftCode>("M1");
  const [reason, setReason] = useState("");
  const selectedShift = shifts.find((shift) => shift.id === shiftId);
  const byEmp = new Map(rows.map((row) => [row.employeeId, row]));
  const scheduleByEmp = new Map(schedules.map((schedule) => [schedule.employeeId, schedule]));
  const actualCodeByEmp = new Map(people.map((person) => [person.id, effectiveShiftCode(scheduleByEmp.get(person.id), adjustments)]));
  const scheduledPeople = people.filter((person) => scheduleByEmp.has(person.id) && person.status === "ACTIVE");
  const onShift = schedules.length
    ? scheduledPeople.filter((person) => {
        const code = actualCodeByEmp.get(person.id);
        return code ? scheduleMatchesManagerShift(code, selectedShift) : false;
      })
    : people.filter((person) => person.status === "ACTIVE" && (!shiftId || person.shiftId === shiftId));
  const adjustmentBatches = useMemo(() => {
    const map = new Map<string, typeof adjustments>();
    for (const item of adjustments) map.set(item.batchId, [...(map.get(item.batchId) ?? []), item]);
    return [...map.values()];
  }, [adjustments]);

  const saveAdjustment = async () => {
    try {
      if (!firstId) throw new Error("Hãy chọn nhân sự");
      if (kind === "SWAP") await swapSchedules(firstId, secondId, date, reason);
      else await changeSchedule(firstId, date, newCode, reason);
      toast.success(kind === "SWAP" ? "Đã đổi ca cho hai người" : "Đã điều chỉnh ca");
      setReason(""); setAdjustOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đổi ca"); }
  };

  return (
    <div>
      <PageHeader
        title="Kiểm tra đầu ca"
        subtitle={`${selectedShift?.name ?? "Ca hiện tại"} · ${onShift.length} nhân sự theo lịch thực tế`}
        action={can(role, "attendance") ? <Button size="sm" variant="secondary" onClick={() => { setFirstId(scheduledPeople[0]?.id ?? ""); setSecondId(scheduledPeople[1]?.id ?? ""); setAdjustOpen(true); }}>Đổi ca</Button> : null}
      />
      {onShift.length === 0 ? <EmptyState title="Không có nhân sự trong ca" hint="Kiểm tra ngày, ca đang chọn hoặc nhập lịch làm việc Excel." /> : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {onShift.map((person) => {
            const rec = byEmp.get(person.id);
            const code = actualCodeByEmp.get(person.id) ?? FALLBACK_BY_ORDER[selectedShift?.order ?? 2] ?? "M1";
            const employeeOt = ots.filter((ot) => ot.employeeId === person.id);
            const arrived = rec?.status === "PRESENT";
            return <li key={person.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-medium">{person.name}</p><p className="font-mono text-xs text-muted">{person.code} · ca thực tế {code}</p></div>
                {rec ? <AttendanceBadge status={rec.status} /> : <span className="text-xs text-muted">Chưa kiểm tra</span>}
              </div>
              {can(role, "attendance") ? <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" variant={arrived ? "secondary" : "default"} disabled={arrived} onClick={async () => {
                  if (!shiftId) return toast.error("Chưa chọn ca quản lý");
                  await confirmAttendance(person.id, date, shiftId, code); toast.success(`${person.name}: đã đến`);
                }}>✓ Đã đến</Button>
                {rec ? <Button size="sm" variant="outline" onClick={async () => { await clearAttendanceConfirmation(rec.id); toast.success("Đã bỏ xác nhận"); }}>Bỏ tích</Button>
                  : <Button size="sm" variant="outline" onClick={async () => { await markAbsent(person.id, "Nghỉ / chưa đến đầu ca"); toast.success("Đã ghi chưa đến"); }}>Chưa đến</Button>}
              </div> : null}
              {arrived && employeeOt.length ? <div className="mt-3 rounded-lg bg-surface-2 p-3">
                <p className="mb-2 text-xs font-medium text-muted">OT cần kiểm tra</p>
                {employeeOt.map((ot) => <div key={ot.id} className="flex items-center justify-between gap-2 py-1">
                  <div><p className="text-sm">{ot.startTime}–{ot.endTime} · {ot.type}</p><p className="text-xs text-muted">{ot.rateLabel ?? "Chưa tính hệ số"}</p></div>
                  {ot.attendanceConfirmedAt ? <span className="text-xs text-ok">Đã xác nhận</span> : <Button size="sm" variant="secondary" onClick={async () => { await confirmAttendanceOvertime(ot.id); toast.success("Đã xác nhận OT"); }}>Xác nhận OT</Button>}
                </div>)}
              </div> : null}
            </li>;
          })}
        </ul>
      )}

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Điều chỉnh lịch thực tế" wide>
        <div className="space-y-3">
          <p className="text-sm text-muted">Lịch Excel gốc được giữ nguyên. Điều chỉnh này có lịch sử và có thể hoàn tác.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={kind === "CHANGE" ? "default" : "outline"} onClick={() => setKind("CHANGE")}>Đổi ca một người</Button>
            <Button variant={kind === "SWAP" ? "default" : "outline"} onClick={() => setKind("SWAP")}>Đổi ca cho nhau</Button>
          </div>
          <Field label="Nhân sự"><NativeSelect value={firstId} onChange={(event) => setFirstId(event.target.value)}>{scheduledPeople.map((person) => <option key={person.id} value={person.id}>{person.code} · {person.name} · {actualCodeByEmp.get(person.id)}</option>)}</NativeSelect></Field>
          {kind === "CHANGE" ? <Field label="Chuyển sang ca"><NativeSelect value={newCode} onChange={(event) => setNewCode(event.target.value as BusinessShiftCode)}>{SHIFT_CODES.map((code) => <option key={code} value={code}>{code} · {BUSINESS_SHIFT_RULES[code].label}</option>)}</NativeSelect></Field>
            : <Field label="Đổi ca với"><NativeSelect value={secondId} onChange={(event) => setSecondId(event.target.value)}>{scheduledPeople.map((person) => <option key={person.id} value={person.id}>{person.code} · {person.name} · {actualCodeByEmp.get(person.id)}</option>)}</NativeSelect></Field>}
          <Field label="Lý do"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: thay người nghỉ đột xuất" /></Field>
          <Button className="w-full" onClick={() => void saveAdjustment()}>Lưu lịch thực tế</Button>
          {adjustmentBatches.length ? <div className="border-t border-border pt-3"><p className="mb-2 text-sm font-medium">Lịch sử điều chỉnh</p>{adjustmentBatches.map((batch) => { const active = batch.some((item) => item.status === "ACTIVE"); return <div key={batch[0]!.batchId} className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-surface-2 p-3"><div className="text-sm">{batch.map((item) => `${people.find((person) => person.id === item.employeeId)?.name ?? item.employeeId}: ${item.originalShiftCode}→${item.adjustedShiftCode}`).join(" · ")}<p className="text-xs text-muted">{active ? "Đang áp dụng" : "Đã hoàn tác"} · {batch[0]!.reason || "Không ghi lý do"}</p></div>{active ? <Button size="sm" variant="outline" onClick={async () => { await revertScheduleAdjustment(batch[0]!.batchId); toast.success("Đã hoàn tác đổi ca"); }}>Hoàn tác</Button> : null}</div>; })}</div> : null}
        </div>
      </Dialog>
    </div>
  );
}
