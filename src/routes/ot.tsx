import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Stat } from "@/components/cvp/page-header";
import { AmhBadge } from "@/components/cvp/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { ExcelImportDialog } from "@/components/cvp/excel-import-dialog";
import { BUSINESS_SHIFT_RULES, effectiveShiftCode, scheduleMatchesManagerShift } from "@/lib/cvp/business-shifts";
import { calculateEmployeeAmh } from "@/lib/cvp/amh";
import { useRows } from "@/lib/cvp/hooks";
import { getDb } from "@/lib/cvp/db";
import { useAppStore } from "@/lib/cvp/store";
import { createAmh, createOvertime, deleteAmh, deleteOvertime, updateAmh } from "@/lib/cvp/repo";
import { computeOtHours } from "@/lib/cvp/ot";
import { computeOtRate } from "@/lib/cvp/ot-rate";
import { formatHours } from "@/lib/cvp/time";
import { OT_TYPES, type Amh, type AmhStatus, type BusinessShiftCode, type Employee } from "@/lib/cvp/types";
import { can } from "@/lib/cvp/permissions";

export const Route = createFileRoute("/ot")({ component: OtPage });

const SHIFT_CODE_BY_ORDER: Record<number, BusinessShiftCode> = {
  1: "M", 2: "M1", 3: "X5", 4: "X", 5: "X3", 6: "A", 7: "D",
};

function OtPage() {
  const date = useAppStore((s) => s.selectedDate);
  const shiftId = useAppStore((s) => s.selectedShiftId);
  const role = useAppStore((s) => s.role);
  const round = useAppStore((s) => s.otRoundMinutes);
  const people = useRows(() => getDb().employees.toArray());
  const ots = useRows(() => getDb().overtimes.where("date").equals(date).toArray(), [date]);
  const amhs = useRows(() => getDb().amhs.where("date").equals(date).toArray(), [date]);
  const schedules = useRows(() => getDb().workSchedules.where("date").equals(date).toArray(), [date]);
  const adjustments = useRows(() => getDb().scheduleAdjustments.where("date").equals(date).toArray(), [date]);
  const attendance = useRows(() => getDb().attendance.where("date").equals(date).toArray(), [date]);
  const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
  const [tab, setTab] = useState<"ot" | "amh">("amh");
  const [otOpen, setOtOpen] = useState(false);
  const [amhOpen, setAmhOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const selectedShift = shifts.find((shift) => shift.id === shiftId);
  const effectiveCodeByEmployee = useMemo(() => {
    const scheduleByEmployee = new Map(schedules.map((item) => [item.employeeId, item]));
    return new Map(
      people.map((person) => [person.id, effectiveShiftCode(scheduleByEmployee.get(person.id), adjustments)]),
    );
  }, [people, schedules, adjustments]);
  const visiblePeople = useMemo(() => schedules.length
    ? people.filter((person) => {
        const code = effectiveCodeByEmployee.get(person.id);
        return person.status === "ACTIVE" && code && scheduleMatchesManagerShift(code, selectedShift);
      })
    : people.filter((person) => person.status === "ACTIVE" && (!shiftId || person.shiftId === shiftId)),
  [people, schedules.length, effectiveCodeByEmployee, selectedShift, shiftId]);
  const visibleIds = new Set(visiblePeople.map((person) => person.id));
  const visibleOt = ots.filter(
    (item) => (!shiftId || item.shiftId === shiftId) && (visibleIds.size === 0 || visibleIds.has(item.employeeId)),
  );
  const amhRows = visiblePeople.map((person) => {
    const code = effectiveCodeByEmployee.get(person.id)
      ?? SHIFT_CODE_BY_ORDER[selectedShift?.order ?? 2]
      ?? "M1";
    const record = attendance.find(
      (item) => item.employeeId === person.id && (!shiftId || item.shiftId === shiftId),
    );
    const calculation = calculateEmployeeAmh({
      date,
      shiftCode: code,
      attendance: record,
      overtimes: ots.filter((item) => item.employeeId === person.id && (!shiftId || item.shiftId === shiftId)),
      adjustments: amhs.filter((item) => item.employeeId === person.id && (!shiftId || item.shiftId === shiftId)),
    });
    return { person, code, calculation };
  });
  const confirmedOtMinutes = visibleOt
    .filter((item) => item.attendanceConfirmedAt)
    .reduce((sum, item) => sum + item.totalMinutes, 0);
  const totalAmhMinutes = amhRows.reduce((sum, item) => sum + item.calculation.totalMinutes, 0);
  const selectablePeople = visiblePeople.length
    ? visiblePeople
    : people.filter((person) => person.status === "ACTIVE");

  return (
    <div>
      <PageHeader
        title="OT / AMH"
        subtitle={`${date} · làm tròn ${round} phút`}
        action={can(role, "manage_ot") ? (
          <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>Nhập Excel</Button>
        ) : null}
      />
      <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <Stat label="OT xác nhận" value={`${formatHours(confirmedOtMinutes)}h`} />
        <Stat label="AMH ngày/ca" value={`${formatHours(totalAmhMinutes)}h`} />
        <Stat label="Nhân sự" value={amhRows.length} />
      </div>
      {can(role, "manage_ot") ? (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button onClick={() => setOtOpen(true)}>Khai OT</Button>
          <Button variant="secondary" onClick={() => setAmhOpen(true)}>Điều chỉnh AMH</Button>
        </div>
      ) : null}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Button variant={tab === "ot" ? "default" : "secondary"} onClick={() => setTab("ot")}>OT</Button>
        <Button variant={tab === "amh" ? "default" : "secondary"} onClick={() => setTab("amh")}>AMH tự tính</Button>
      </div>

      {tab === "ot" ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {visibleOt.map((item) => {
            const who = people.find((person) => person.id === item.employeeId);
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{who?.name ?? "—"}</p>
                  <p className="font-mono text-xs text-muted">{item.startTime}–{item.endTime} · {item.type}</p>
                  <p className="text-xs text-muted">
                    {item.rateLabel || `${item.ratePercent ?? "—"}%`} · {item.attendanceConfirmedAt ? "Đã xác nhận" : "Chờ chấm công xác nhận"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-lg tabular-nums">{formatHours(item.totalMinutes)}h</p>
                  {can(role, "manage_ot") ? (
                    <button className="text-xs text-danger" onClick={() => void deleteOvertime(item.id)}>Xóa</button>
                  ) : null}
                </div>
              </li>
            );
          })}
          {visibleOt.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">Chưa có OT trong ngày/ca này</li>
          ) : null}
        </ul>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted">
            AMH = giờ ca thực tế đã xác nhận + OT đã xác nhận + điều chỉnh đã duyệt. Ca nghỉ có giờ ca bằng 0.
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {amhRows.map(({ person, code, calculation }) => {
              const stateLabel = calculation.state === "CONFIRMED"
                ? "Đã xác nhận"
                : calculation.state === "ABSENT"
                  ? "Nghỉ"
                  : calculation.state === "OPEN"
                    ? "Chưa chấm ra"
                    : "Chưa xác nhận";
              return (
                <li key={person.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="text-xs text-muted">Ca {code} · {stateLabel}</p>
                    </div>
                    <p className="font-mono text-lg tabular-nums">{formatHours(calculation.totalMinutes)}h</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Ca {formatHours(calculation.regularMinutes)}h · OT {formatHours(calculation.overtimeMinutes)}h · Điều chỉnh {formatHours(calculation.adjustmentMinutes)}h
                  </p>
                </li>
              );
            })}
            {amhRows.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted">Không có nhân sự theo lịch thực tế trong ngày/ca này</li>
            ) : null}
          </ul>
          <AmhAdjustments
            amhs={amhs.filter((item) => !shiftId || item.shiftId === shiftId)}
            people={people}
            editable={can(role, "manage_ot")}
          />
        </div>
      )}

      <OvertimeDialog
        open={otOpen}
        onClose={() => setOtOpen(false)}
        people={selectablePeople}
        date={date}
        shiftId={shiftId ?? shifts[0]?.id ?? ""}
        round={round}
        shiftCodes={effectiveCodeByEmployee}
      />
      <AmhAdjustmentDialog
        open={amhOpen}
        onClose={() => setAmhOpen(false)}
        people={selectablePeople}
        date={date}
        shiftId={shiftId ?? shifts[0]?.id ?? ""}
      />
      <ExcelImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        kind="ot"
        date={date}
        shiftId={shiftId ?? shifts[0]?.id ?? ""}
        shifts={shifts}
        employees={people}
      />
    </div>
  );
}

function AmhAdjustments({ amhs, people, editable }: { amhs: Amh[]; people: Employee[]; editable: boolean }) {
  if (!amhs.length) return null;
  return (
    <section>
      <p className="mb-2 text-sm font-medium">Phiếu điều chỉnh AMH</p>
      <ul className="space-y-2">
        {amhs.map((item) => {
          const who = people.find((person) => person.id === item.employeeId);
          return (
            <li key={item.id} className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{who?.name ?? "—"}</p>
                  <p className="text-xs text-muted">{item.hours > 0 ? "+" : ""}{item.hours}h · {item.note}</p>
                </div>
                <AmhBadge status={item.status} />
              </div>
              {editable ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["APPROVED", "REJECTED", "DONE"] as AmhStatus[]).map((status) => (
                    <Button key={status} size="sm" variant="secondary" onClick={() => void updateAmh(item.id, { status })}>
                      {status === "APPROVED" ? "Duyệt" : status === "REJECTED" ? "Từ chối" : "Xong"}
                    </Button>
                  ))}
                  <Button size="sm" variant="danger" onClick={() => void deleteAmh(item.id)}>Xóa</Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function addClockHours(clock: string, hours: number): string {
  const [h = 0, m = 0] = clock.split(":").map(Number);
  const total = (h * 60 + m + hours * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function OvertimeDialog({
  open, onClose, people, date, shiftId, round, shiftCodes,
}: {
  open: boolean;
  onClose: () => void;
  people: Employee[];
  date: string;
  shiftId: string;
  round: number;
  shiftCodes: Map<string, BusinessShiftCode | null>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("19:00");
  const [type, setType] = useState<string>(OT_TYPES[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    const id = people[0]?.id ?? "";
    const code = shiftCodes.get(id);
    const end = code ? BUSINESS_SHIFT_RULES[code].endTime : "17:00";
    setEmployeeId(id);
    setStartTime(end);
    setEndTime(addClockHours(end, 2));
    setType(OT_TYPES[0]);
    setNote("");
  }, [open, people, shiftCodes]);
  const code = shiftCodes.get(employeeId);
  const hours = computeOtHours({ startTime, endTime, roundMinutes: round });
  const rate = useMemo(
    () => computeOtRate(date, startTime, endTime, code ?? null),
    [date, startTime, endTime, code],
  );

  return (
    <Dialog open={open} onClose={onClose} title="Khai báo OT">
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!employeeId) return toast.error("Chưa có nhân sự để khai OT");
          if (startTime === endTime || hours <= 0) return toast.error("Thời gian OT chưa hợp lệ");
          await createOvertime({ employeeId, date, shiftId, startTime, endTime, type, note: note.trim() });
          toast.success(`Đã lưu ${hours} giờ OT · ${rate.ratePercent}%`);
          onClose();
        }}
      >
        <Field label="Nhân sự">
          <NativeSelect
            value={employeeId}
            onChange={(event) => {
              const id = event.target.value;
              setEmployeeId(id);
              const shiftCode = shiftCodes.get(id);
              if (shiftCode) {
                const end = BUSINESS_SHIFT_RULES[shiftCode].endTime;
                setStartTime(end);
                setEndTime(addClockHours(end, 2));
              }
            }}
          >
            {people.map((person) => <option key={person.id} value={person.id}>{person.code} · {person.name}</option>)}
          </NativeSelect>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Bắt đầu"><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></Field>
          <Field label="Kết thúc"><Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></Field>
        </div>
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p><span className="font-mono text-lg">{hours}h</span> · qua 00:00 vẫn tính đúng</p>
          <p className="text-xs text-muted">{rate.rateLabel}</p>
        </div>
        <Field label="Loại OT">
          <NativeSelect value={type} onChange={(event) => setType(event.target.value)}>
            {OT_TYPES.map((item) => <option key={item}>{item}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Ghi chú"><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nội dung làm thêm" /></Field>
        <Button type="submit" className="w-full">Lưu OT</Button>
      </form>
    </Dialog>
  );
}

function AmhAdjustmentDialog({
  open, onClose, people, date, shiftId,
}: {
  open: boolean;
  onClose: () => void;
  people: Employee[];
  date: string;
  shiftId: string;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) {
      setEmployeeId(people[0]?.id ?? "");
      setHours("");
      setNote("");
    }
  }, [open, people]);
  return (
    <Dialog open={open} onClose={onClose} title="Điều chỉnh AMH">
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const value = Number(hours);
          if (!employeeId) return toast.error("Chưa có nhân sự để điều chỉnh");
          if (!Number.isFinite(value) || value === 0) return toast.error("Nhập số giờ khác 0");
          if (!note.trim()) return toast.error("Cần ghi rõ lý do điều chỉnh");
          await createAmh({
            employeeId,
            date,
            shiftId,
            hours: value,
            status: "DECLARED",
            note: note.trim(),
            taskId: null,
          });
          toast.success("Đã tạo phiếu điều chỉnh AMH");
          onClose();
        }}
      >
        <Field label="Nhân sự">
          <NativeSelect value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            {people.map((person) => <option key={person.id} value={person.id}>{person.code} · {person.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Số giờ điều chỉnh" hint="Số dương để cộng, số âm để trừ.">
          <Input type="number" step="0.1" inputMode="decimal" value={hours} onChange={(event) => setHours(event.target.value)} placeholder="Ví dụ: 1.5 hoặc -0.5" required />
        </Field>
        <Field label="Lý do">
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bắt buộc ghi lý do" required />
        </Field>
        <Button type="submit" className="w-full">Tạo phiếu chờ duyệt</Button>
      </form>
    </Dialog>
  );
}
