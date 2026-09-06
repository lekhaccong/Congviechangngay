import { getDb } from "@/lib/cvp/db";
import type { Amh, Attendance, Checklist, ChecklistItem, Employee, Overtime, ScheduleAdjustment, SyncEntityType, Task, WorkBlock, WorkSchedule } from "@/lib/cvp/types";

export async function toCloud(entityType: SyncEntityType, value: unknown): Promise<Record<string, unknown>> {
  if (entityType === "employees") {
    const row = value as Employee; const group = await getDb().groups.get(row.groupId);
    const legacyRole = row.role as string;
    const localRole = legacyRole === "LEADER" ? "MANAGER" : legacyRole === "USER" ? "EMPLOYEE" : ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"].includes(legacyRole) ? legacyRole : "EMPLOYEE";
    return { id: row.id, sbd: row.code, name: row.name, group_name: group?.name ?? "", phone: row.phone ?? "", status: row.status, note: row.note, local_role: localRole, local_shift_id: row.shiftId, client_updated_at: new Date(row.updatedAt).toISOString(), deleted_at: null };
  }
  if (entityType === "work_schedules") {
    const row = value as WorkSchedule;
    return { id: row.id, employee_id: row.employeeId, work_date: row.date, shift_code: row.shiftCode, source: row.source, client_updated_at: new Date(row.updatedAt).toISOString(), deleted_at: null };
  }
  if (entityType === "schedule_adjustments") {
    const row = value as ScheduleAdjustment;
    return { id: row.id, batch_id: row.batchId, work_date: row.date, employee_id: row.employeeId, original_shift_code: row.originalShiftCode, adjusted_shift_code: row.adjustedShiftCode, kind: row.kind, reason: row.reason, status: row.status, created_by_name: row.createdBy, client_created_at: new Date(row.createdAt).toISOString(), reverted_at: row.revertedAt ? new Date(row.revertedAt).toISOString() : null, deleted_at: null };
  }
  if (entityType === "overtimes") {
    const row = value as Overtime;
    return { id: row.id, employee_id: row.employeeId, work_date: row.date, manager_shift_id: row.shiftId, start_time: row.startTime, end_time: row.endTime, total_minutes: row.totalMinutes, ot_type: row.type, note: row.note, rate_percent: row.ratePercent ?? null, rate_label: row.rateLabel ?? null, attendance_confirmed_at: row.attendanceConfirmedAt ? new Date(row.attendanceConfirmedAt).toISOString() : null, attendance_confirmed_by: row.attendanceConfirmedBy ?? null, client_created_at: new Date(row.createdAt).toISOString(), deleted_at: null };
  }
  if (entityType === "amhs") {
    const row = value as Amh;
    return { id: row.id, employee_id: row.employeeId, work_date: row.date, manager_shift_id: row.shiftId, hours: row.hours, status: row.status, note: row.note, task_id: row.taskId, client_created_at: new Date(row.createdAt).toISOString(), deleted_at: null };
  }
  if (entityType === "work_blocks") {
    const row = value as WorkBlock;
    return { id: row.id, name: row.name, sort_order: row.order, deleted_at: null };
  }
  if (entityType === "checklists") {
    const row = value as Checklist;
    return { id: row.id, block_id: row.blockId, name: row.name, deleted_at: null };
  }
  if (entityType === "tasks") {
    const row = value as Task;
    return { id: row.id, name: row.name, block_id: row.blockId, assignee_id: row.assigneeId || null, work_date: row.date, manager_shift_id: row.shiftId, estimated_minutes: row.estimatedMinutes, deadline: row.deadline ? new Date(row.deadline).toISOString() : null, reminder_time: row.reminderTime ? new Date(row.reminderTime).toISOString() : null, status: row.status, progress: row.progress, note: row.note, client_created_at: new Date(row.createdAt).toISOString(), client_updated_at: new Date(row.updatedAt).toISOString(), completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null, deleted_at: null };
  }
  if (entityType === "checklist_items") {
    const row = value as ChecklistItem;
    return { id: row.id, checklist_id: row.checklistId, task_id: row.taskId, label: row.label, done: row.done, completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null, completed_by: row.completedBy, note: row.note, sort_order: row.order, deleted_at: null };
  }
  const row = value as Attendance;
  return { id: row.id, employee_id: row.employeeId, work_date: row.date, manager_shift_id: row.shiftId, actual_shift_code: row.actualShiftCode ?? null, status: row.status, note: row.note, confirmed_at: row.confirmedAt ? new Date(row.confirmedAt).toISOString() : null, confirmed_by_name: row.confirmedBy ?? null, check_in: row.checkIn ? new Date(row.checkIn).toISOString() : null, check_out: row.checkOut ? new Date(row.checkOut).toISOString() : null, ot_minutes: row.otMinutes, client_created_at: new Date(row.createdAt).toISOString(), deleted_at: null };
}

function millis(value: string | null | undefined): number | null { return value ? new Date(value).getTime() : null; }

export async function applyCloudRow(entityType: SyncEntityType, row: Record<string, any>): Promise<void> {
  const db = getDb();
  if (row.deleted_at) {
    if (entityType === "employees") await db.employees.delete(row.id);
    else if (entityType === "work_schedules") await db.workSchedules.delete(row.id);
    else if (entityType === "schedule_adjustments") await db.scheduleAdjustments.delete(row.id);
    else if (entityType === "attendance") await db.attendance.delete(row.id);
    else if (entityType === "overtimes") await db.overtimes.delete(row.id);
    else if (entityType === "amhs") await db.amhs.delete(row.id);
    else if (entityType === "work_blocks") await db.workBlocks.delete(row.id);
    else if (entityType === "checklists") await db.checklists.delete(row.id);
    else if (entityType === "tasks") await db.tasks.delete(row.id);
    else await db.checklistItems.delete(row.id);
    return;
  }
  if (entityType === "employees") {
    let group = await db.groups.filter((item) => item.name.trim().toLowerCase() === String(row.group_name ?? "").trim().toLowerCase()).first();
    if (!group) { group = { id: `cloud-group-${crypto.randomUUID()}`, name: row.group_name || "Chưa phân nhóm", order: (await db.groups.count()) + 1 }; await db.groups.add(group); }
    await db.employees.put({ id: row.id, code: row.sbd, serialNumber: row.sbd, name: row.name, groupId: group.id, shiftId: row.local_shift_id ?? "shift-2", status: row.status, role: row.local_role ?? "EMPLOYEE", phone: row.phone ?? "", note: row.note ?? "", createdAt: millis(row.created_at) ?? Date.now(), updatedAt: millis(row.client_updated_at) ?? millis(row.updated_at) ?? Date.now() });
  } else if (entityType === "work_schedules") {
    await db.workSchedules.put({ id: row.id, employeeId: row.employee_id, date: row.work_date, shiftCode: row.shift_code, source: row.source, createdAt: millis(row.created_at) ?? Date.now(), updatedAt: millis(row.client_updated_at) ?? millis(row.updated_at) ?? Date.now() });
  } else if (entityType === "schedule_adjustments") {
    await db.scheduleAdjustments.put({ id: row.id, batchId: row.batch_id, date: row.work_date, employeeId: row.employee_id, originalShiftCode: row.original_shift_code, adjustedShiftCode: row.adjusted_shift_code, kind: row.kind, reason: row.reason ?? "", status: row.status, createdBy: row.created_by_name ?? "Cloud", createdAt: millis(row.client_created_at) ?? Date.now(), revertedAt: millis(row.reverted_at) });
  } else if (entityType === "attendance") {
    await db.attendance.put({ id: row.id, employeeId: row.employee_id, date: row.work_date, shiftId: row.manager_shift_id, actualShiftCode: row.actual_shift_code ?? undefined, status: row.status, note: row.note ?? "", confirmedAt: millis(row.confirmed_at) ?? undefined, confirmedBy: row.confirmed_by_name ?? undefined, checkIn: millis(row.check_in), checkOut: millis(row.check_out), otMinutes: row.ot_minutes ?? 0, createdAt: millis(row.client_created_at) ?? Date.now() });
  } else if (entityType === "overtimes") {
    await db.overtimes.put({ id: row.id, employeeId: row.employee_id, date: row.work_date, shiftId: row.manager_shift_id, startTime: row.start_time, endTime: row.end_time, totalMinutes: row.total_minutes, type: row.ot_type, note: row.note ?? "", ratePercent: row.rate_percent ?? undefined, rateLabel: row.rate_label ?? undefined, attendanceConfirmedAt: millis(row.attendance_confirmed_at) ?? undefined, attendanceConfirmedBy: row.attendance_confirmed_by ?? undefined, createdAt: millis(row.client_created_at) ?? Date.now() });
  } else if (entityType === "amhs") {
    await db.amhs.put({ id: row.id, employeeId: row.employee_id, date: row.work_date, shiftId: row.manager_shift_id, hours: Number(row.hours), status: row.status, note: row.note ?? "", taskId: row.task_id ?? null, createdAt: millis(row.client_created_at) ?? Date.now() });
  } else if (entityType === "work_blocks") {
    await db.workBlocks.put({ id: row.id, name: row.name, order: row.sort_order });
  } else if (entityType === "checklists") {
    await db.checklists.put({ id: row.id, blockId: row.block_id, name: row.name });
  } else if (entityType === "tasks") {
    await db.tasks.put({ id: row.id, name: row.name, blockId: row.block_id, assigneeId: row.assignee_id ?? "", date: row.work_date, shiftId: row.manager_shift_id, estimatedMinutes: row.estimated_minutes, deadline: millis(row.deadline), reminderTime: millis(row.reminder_time), status: row.status, progress: row.progress, note: row.note ?? "", createdAt: millis(row.client_created_at) ?? Date.now(), updatedAt: millis(row.client_updated_at) ?? millis(row.updated_at) ?? Date.now(), completedAt: millis(row.completed_at) });
  } else {
    await db.checklistItems.put({ id: row.id, checklistId: row.checklist_id, taskId: row.task_id, threeSId: null, label: row.label, done: row.done, completedAt: millis(row.completed_at), completedBy: row.completed_by, photoId: null, note: row.note ?? "", order: row.sort_order });
  }
}
