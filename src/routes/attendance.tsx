import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/cvp/page-header";
import { AttendanceBadge } from "@/components/cvp/status-badge";
import { Button } from "@/components/ui/button";
import { useRows } from "@/lib/cvp/hooks";
import { getDb } from "@/lib/cvp/db";
import { useAppStore } from "@/lib/cvp/store";
import { checkIn, checkOut, markAbsent } from "@/lib/cvp/repo";
import { can } from "@/lib/cvp/permissions";
import { formatTime } from "@/lib/cvp/time";

export const Route = createFileRoute("/attendance")({ component: AttendancePage });

function AttendancePage() {
  const date = useAppStore((s) => s.selectedDate);
  const shiftId = useAppStore((s) => s.selectedShiftId);
  const role = useAppStore((s) => s.role);
  const people = useRows(() => getDb().employees.orderBy("code").toArray());
  const rows = useRows(
    () => getDb().attendance.filter((a) => a.date === date && (!shiftId || a.shiftId === shiftId)).toArray(),
    [date, shiftId],
  );
  const byEmp = new Map(rows.map((r) => [r.employeeId, r]));
  const onShift = people.filter((p) => !shiftId || p.shiftId === shiftId);

  return (
    <div>
      <PageHeader title="Chấm công" subtitle="Giờ lấy từ đồng hồ điện thoại" />
      <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        {onShift.map((p) => {
          const rec = byEmp.get(p.id);
          return (
            <li key={p.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="font-mono text-xs text-muted">
                    {p.code}
                    {rec?.checkIn ? ` · vào ${formatTime(rec.checkIn)}` : ""}
                    {rec?.checkOut ? ` · ra ${formatTime(rec.checkOut)}` : ""}
                  </p>
                </div>
                {rec ? <AttendanceBadge status={rec.status} /> : <span className="text-xs text-muted">Chưa chấm</span>}
              </div>
              {can(role, "attendance") && p.status === "ACTIVE" ? (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={Boolean(rec?.checkIn)}
                    onClick={async () => {
                      try {
                        await checkIn(p.id);
                        toast.success(`Đã chấm vào: ${p.name}`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Lỗi");
                      }
                    }}
                  >
                    Vào
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!rec?.checkIn || Boolean(rec?.checkOut)}
                    onClick={async () => {
                      try {
                        await checkOut(p.id);
                        toast.success(`Đã chấm ra: ${p.name}`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Lỗi");
                      }
                    }}
                  >
                    Ra
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await markAbsent(p.id, "Nghỉ");
                      toast.success("Đã ghi nghỉ");
                    }}
                  >
                    Nghỉ
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
