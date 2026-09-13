import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import type { EmployeeStatus, Role } from "@/lib/cvp/types";

const SHIFT_CODE_BY_ORDER: Record<number, string> = { 1: "M", 2: "M1", 3: "X5", 4: "X", 5: "X3", 6: "A", 7: "D" };

export function PersonForm({
  open,
  onClose,
  groups,
  shifts,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  groups: { id: string; name: string }[];
  shifts: { id: string; name: string; startTime?: string; endTime?: string; order?: number }[];
  initial?: {
    code: string;
    name: string;
    serialNumber: string;
    groupId: string;
    shiftId: string;
    status: EmployeeStatus;
    role: Role;
    position?: string;
    phone?: string;
    note: string;
  };
  onSave: (data: {
    code: string;
    name: string;
    serialNumber: string;
    groupId: string;
    shiftId: string;
    status: EmployeeStatus;
    role: Role;
    position: string;
    phone: string;
    note: string;
  }) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [serialNumber, setSerial] = useState("");
  const [position, setPosition] = useState("");
  const [groupId, setGroupId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>("ACTIVE");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setCode(initial?.code ?? "");
    setName(initial?.name ?? "");
    setSerial(initial?.serialNumber ?? "");
    setPosition(initial?.position ?? "");
    setGroupId(initial?.groupId ?? groups[0]?.id ?? "");
    setShiftId(initial?.shiftId ?? shifts[0]?.id ?? "");
    setStatus(initial?.status ?? "ACTIVE");
    setRole(initial?.role ?? "EMPLOYEE");
    setPhone(initial?.phone ?? "");
    setNote(initial?.note ?? "");
  }, [open, initial, groups, shifts]);

  return (
    <Dialog open={open} onClose={onClose} title={initial ? "Sửa nhân sự" : "Thêm nhân sự"}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({ code: code || serialNumber, name, serialNumber, position, groupId, shiftId, status, role, phone, note });
        }}
      >
        <Field label="SBD">
          <Input value={serialNumber} onChange={(e) => setSerial(e.target.value)} required />
        </Field>
        <Field label="Họ tên">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Mã nhân viên">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Để trống = dùng SBD" />
        </Field>
        <Field label="Vị trí công việc">
          <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Leader, Lái xe, Đóng Cont…" />
        </Field>
        <Field label="Nhóm">
          <NativeSelect value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Số điện thoại"><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
        <Field label="Ca">
          <NativeSelect value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.order ? `${SHIFT_CODE_BY_ORDER[s.order] ?? s.name} ${s.startTime ?? ""}–${s.endTime ?? ""}` : s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Trạng thái">
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}>
            <option value="ACTIVE">Đang làm</option>
            <option value="LEAVE">Nghỉ</option>
            <option value="SUSPENDED">Tạm hoãn</option>
          </NativeSelect>
        </Field>
        <Field label="Quyền">
          <NativeSelect value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="ADMIN">Quản trị</option>
            <option value="MANAGER">Quản lý</option>
            <option value="EMPLOYEE">Nhân sự</option>
            <option value="VIEWER">Chỉ xem</option>
          </NativeSelect>
        </Field>
        <Field label="Ghi chú">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full">
          Lưu
        </Button>
      </form>
    </Dialog>
  );
}
