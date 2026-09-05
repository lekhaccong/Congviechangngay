import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/cvp/page-header";
import { EmployeeBadge } from "@/components/cvp/status-badge";
import { FilterChip } from "@/components/cvp/filter-chip";
import { PersonForm } from "@/components/cvp/person-form";
import { ExcelImportDialog } from "@/components/cvp/excel-import-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRows } from "@/lib/cvp/hooks";
import { getDb } from "@/lib/cvp/db";
import { can } from "@/lib/cvp/permissions";
import { useAppStore } from "@/lib/cvp/store";
import { createEmployee, createGroup, deleteEmployees, deleteGroup, renameGroup } from "@/lib/cvp/repo";
import { ROLE_LABEL } from "@/lib/cvp/types";
import { effectiveShiftCode } from "@/lib/cvp/business-shifts";
import { BUSINESS_SHIFT_RULES } from "@/lib/cvp/business-shifts";

export const Route = createFileRoute("/people/")({ component: PeoplePage });

function PeoplePage() {
  const role = useAppStore((s) => s.role);
  const date = useAppStore((s) => s.selectedDate);
  const people = useRows(() => getDb().employees.orderBy("code").toArray());
  const groups = useRows(() => getDb().groups.orderBy("order").toArray());
  const shifts = useRows(() => getDb().shifts.orderBy("order").toArray());
  const schedules = useRows(() => getDb().workSchedules.where("date").equals(date).toArray(), [date]);
  const adjustments = useRows(() => getDb().scheduleAdjustments.where("date").equals(date).toArray(), [date]);
  const [groupFilter, setGroupFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupOpen, setGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const filtered = people.filter((p) => {
    if (groupFilter !== "all" && p.groupId !== groupFilter) return false;
    const schedule = schedules.find((item) => item.employeeId === p.id);
    const code = effectiveShiftCode(schedule, adjustments);
    if (shiftFilter === "all") return true;
    if (shiftFilter === "REST") return !!code && !BUSINESS_SHIFT_RULES[code].working;
    return code === shiftFilter;
  });

  return (
    <div>
      <PageHeader
        title="Nhân sự"
        subtitle={`${people.length} người`}
        action={
          can(role, "manage_people") ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setSelecting((value) => !value); setSelected(new Set()); }}>{selecting ? "Hủy" : "Chọn"}</Button>
              <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>Nhập Excel</Button>
              <Button size="sm" onClick={() => setOpen(true)}>Thêm</Button>
            </div>
          ) : null
        }
      />
      <div className="mb-3 flex gap-2 overflow-x-auto">
        <FilterChip active={groupFilter === "all"} onClick={() => setGroupFilter("all")}>
          Tất cả
        </FilterChip>
        {groups.map((g) => (
          <FilterChip key={g.id} active={groupFilter === g.id} onClick={() => setGroupFilter(g.id)}>
            {g.name}
          </FilterChip>
        ))}
        {can(role, "manage_people") ? (
          <Button variant="ghost" size="sm" onClick={() => setGroupOpen(true)}>
            Nhóm/Vị trí
          </Button>
        ) : null}
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        <FilterChip active={shiftFilter === "all"} onClick={() => setShiftFilter("all")}>Tất cả ca</FilterChip>
        {Object.keys(BUSINESS_SHIFT_RULES).filter((code) => BUSINESS_SHIFT_RULES[code as keyof typeof BUSINESS_SHIFT_RULES].working).map((code) => <FilterChip key={code} active={shiftFilter === code} onClick={() => setShiftFilter(code)}>{code}</FilterChip>)}
        <FilterChip active={shiftFilter === "REST"} onClick={() => setShiftFilter("REST")}>Nghỉ</FilterChip>
      </div>
      {selecting ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <button
            type="button"
            className="text-sm text-muted"
            onClick={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((item) => item.id)))}
          >
            {selected.size === filtered.length && filtered.length ? "Bỏ chọn tất cả" : "Chọn tất cả"} · {selected.size} người
          </button>
          <Button
            size="sm"
            variant="danger"
            disabled={!selected.size}
            onClick={async () => {
              if (!confirm(`Xóa ${selected.size} nhân sự đã chọn?`)) return;
              await deleteEmployees([...selected]);
              toast.success(`Đã xóa ${selected.size} nhân sự`);
              setSelected(new Set());
              setSelecting(false);
            }}
          >
            Xóa đã chọn
          </Button>
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <EmptyState title="Chưa có nhân sự" hint="Thêm người để chấm công và giao việc." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {filtered.map((p) => {
            const g = groups.find((x) => x.id === p.groupId);
            const s = shifts.find((x) => x.id === p.shiftId);
            const schedule = schedules.find((x) => x.employeeId === p.id);
            const actualShiftCode = effectiveShiftCode(schedule, adjustments);
            return (
              <li key={p.id} className="flex items-center">
                {selecting ? (
                  <input
                    type="checkbox"
                    className="ml-4 size-5 accent-primary"
                    checked={selected.has(p.id)}
                    onChange={() => setSelected((current) => { const next = new Set(current); next.has(p.id) ? next.delete(p.id) : next.add(p.id); return next; })}
                    aria-label={`Chọn ${p.name}`}
                  />
                ) : null}
                <Link to="/people/$id" params={{ id: p.id }} className="flex min-h-16 flex-1 items-center justify-between gap-3 px-4 py-3" onClick={(event) => { if (!selecting) return; event.preventDefault(); setSelected((current) => { const next = new Set(current); next.has(p.id) ? next.delete(p.id) : next.add(p.id); return next; }); }}>
                  <div className="min-w-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted">
                      {p.code} · {g?.name} · {actualShiftCode ? `${schedule?.shiftCode ?? actualShiftCode}${actualShiftCode !== schedule?.shiftCode ? ` → ${actualShiftCode}` : ""}` : s?.name} · {ROLE_LABEL[p.role]}
                    </p>
                  </div>
                  <EmployeeBadge status={p.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <PersonForm
        open={open}
        onClose={() => setOpen(false)}
        groups={groups}
        shifts={shifts}
        onSave={async (data) => {
          await createEmployee(data);
          toast.success("Đã thêm nhân sự");
          setOpen(false);
        }}
      />
      <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)} kind="people" date="" shiftId={shifts[0]?.id ?? ""} shifts={shifts} />

      <Dialog open={groupOpen} onClose={() => setGroupOpen(false)} title="Nhóm/Vị trí">
        <ul className="mb-4 space-y-2">
          {groups.map((g) => (
            <li key={g.id} className="flex gap-2">
              <Input
                defaultValue={g.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== g.name) void renameGroup(g.id, v);
                }}
              />
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  try {
                    await deleteGroup(g.id);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Không xóa được");
                  }
                }}
              >
                Xóa
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Tên nhóm mới" />
          <Button
            onClick={async () => {
              if (!newGroup.trim()) return;
              await createGroup(newGroup.trim());
              setNewGroup("");
            }}
          >
            Thêm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
