import { getDb } from "@/lib/cvp/db";
import type { Abnormality, Amh, Attendance, Checklist, ChecklistItem, DataItem, Employee, GoodsItem, Lot, LotClosure, Overtime, Photo, ScheduleAdjustment, SyncEntityType, Task, WorkBlock, WorkSchedule } from "@/lib/cvp/types";

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
    // Repair tasks created by older builds while the async select options were
    // still loading. The UI displayed the first values, but stored empty ids.
    const db = getDb();
    const fallbackBlock = row.blockId ? undefined : await db.workBlocks.orderBy("order").first();
    const fallbackAssignee = row.assigneeId ? undefined : await db.employees.filter((employee) => !employee.sample).first();
    const blockId = row.blockId || fallbackBlock?.id;
    if (!blockId) throw new Error(`Công việc ${row.name} chưa có khối công việc`);
    return { id: row.id, name: row.name, block_id: blockId, assignee_id: row.assigneeId || fallbackAssignee?.id || null, work_date: row.date, manager_shift_id: row.shiftId, estimated_minutes: row.estimatedMinutes, deadline: row.deadline ? new Date(row.deadline).toISOString() : null, reminder_time: row.reminderTime ? new Date(row.reminderTime).toISOString() : null, status: row.status, progress: row.progress, note: row.note ?? "", client_created_at: new Date(row.createdAt).toISOString(), client_updated_at: new Date(row.updatedAt).toISOString(), completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null, deleted_at: null };
  }
  if (entityType === "checklist_items") {
    const row = value as ChecklistItem;
    return { id: row.id, checklist_id: row.checklistId, task_id: row.taskId, label: row.label, done: row.done, completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null, completed_by: row.completedBy, note: row.note, sort_order: row.order, deleted_at: null };
  }
  if (entityType === "abnormalities") {
    const row = value as Abnormality;
    return { id: row.id, abnormal_type: row.type, description: row.description, severity: row.severity, detected_by: row.detectedBy, detected_at: new Date(row.detectedAt).toISOString(), handler_id: row.handlerId, deadline: row.deadline ? new Date(row.deadline).toISOString() : null, status: row.status, linked_module: row.linkedModule, linked_id: row.linkedId, work_block_id: row.workBlockId ?? null, task_id: row.taskId ?? null, work_date: row.date ?? null, manager_shift_id: row.shiftId ?? null, client_created_at: new Date(row.createdAt).toISOString(), client_updated_at: new Date(row.updatedAt).toISOString(), deleted_at: null };
  }
  if (entityType === "abnormal_photos") {
    const row = value as Photo; const blob = await getDb().blobs.get(row.blobId);
    return { id: row.id, abnormality_id: row.ownerId, storage_path: row.storagePath, mime_type: blob?.mime ?? "image/jpeg", photo_kind: row.kind, note: row.note, client_created_at: new Date(row.createdAt).toISOString(), deleted_at: null };
  }
  if (entityType === "data_items") {
    const row = value as DataItem;
    return { id: row.id, product_code: row.productCode, design_code: row.designCode, received_at: new Date(row.receivedAt).toISOString(), invoice: row.invoice, lot: row.lot, quantity: row.quantity, status: row.status, note: row.note, completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null, client_created_at: new Date(row.createdAt).toISOString(), client_updated_at: new Date(row.updatedAt).toISOString(), deleted_at: null };
  }
  if (entityType === "goods_items") {
    const row = value as GoodsItem;
    return { id: row.id, invoice: row.invoice, item_code: row.itemCode, product_code: row.productCode, lot: row.lot, quantity: row.quantity, export_date: row.exportDate, status: row.status, source_kind: row.sourceKind ?? "SEA", destination: row.destination ?? "", confirmation: row.confirmation ?? "", container_count: row.containerCount ?? 0, loose_quantity: row.looseQuantity ?? "", warehouse: row.warehouse ?? "", note: row.note, client_created_at: new Date(row.createdAt).toISOString(), client_updated_at: new Date(row.updatedAt).toISOString(), deleted_at: null };
  }
  if (entityType === "lots") {
    const row = value as Lot;
    return { id: row.id, lot_code: row.lotCode, invoice: row.invoice, product_code: row.productCode, work_date: row.date, quantity: row.quantity, status: row.status, client_created_at: new Date(row.createdAt).toISOString(), deleted_at: null };
  }
  if (entityType === "lot_closures") {
    const row = value as LotClosure;
    return { id: row.id, lot_id: row.lotId, closed_by_name: row.closedBy, closed_at: new Date(row.closedAt).toISOString(), note: row.note, local_photo_id: row.photoId, client_created_at: new Date(row.closedAt).toISOString(), deleted_at: null };
  }
  if (entityType === "goods_photos") {
    const row = value as Photo; const blob = await getDb().blobs.get(row.blobId);
    return { id: row.id, owner_module: row.ownerModule, owner_id: row.ownerId, storage_path: row.storagePath, mime_type: blob?.mime ?? "image/jpeg", photo_kind: row.kind, note: row.note, client_created_at: new Date(row.createdAt).toISOString(), deleted_at: null };
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
    else if (entityType === "checklist_items") await db.checklistItems.delete(row.id);
    else if (entityType === "abnormalities") await db.abnormalities.delete(row.id);
    else if (entityType === "data_items") await db.dataItems.delete(row.id);
    else if (entityType === "goods_items") await db.goodsItems.delete(row.id);
    else if (entityType === "lots") await db.lots.delete(row.id);
    else if (entityType === "lot_closures") await db.lotClosures.delete(row.id);
    else { const photo = await db.photos.get(row.id); await db.photos.delete(row.id); if (photo) await db.blobs.delete(photo.blobId); }
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
  } else if (entityType === "checklist_items") {
    await db.checklistItems.put({ id: row.id, checklistId: row.checklist_id, taskId: row.task_id, threeSId: null, label: row.label, done: row.done, completedAt: millis(row.completed_at), completedBy: row.completed_by, photoId: null, note: row.note ?? "", order: row.sort_order });
  } else if (entityType === "abnormalities") {
    await db.abnormalities.put({ id: row.id, type: row.abnormal_type, description: row.description ?? "", severity: row.severity, detectedBy: row.detected_by ?? "Cloud", detectedAt: millis(row.detected_at) ?? Date.now(), handlerId: row.handler_id, deadline: millis(row.deadline), status: row.status, linkedModule: row.linked_module, linkedId: row.linked_id, workBlockId: row.work_block_id, taskId: row.task_id, date: row.work_date, shiftId: row.manager_shift_id, createdAt: millis(row.client_created_at) ?? millis(row.created_at) ?? Date.now(), updatedAt: millis(row.client_updated_at) ?? millis(row.updated_at) ?? Date.now() });
  } else if (entityType === "abnormal_photos" || entityType === "goods_photos") {
    const current = await db.photos.get(row.id);
    if (current && current.storagePath === row.storage_path && await db.blobs.get(current.blobId)) return;
    const { supabase } = await import("@/lib/supabase/client");
    if (!supabase) return;
    const bucket = entityType === "abnormal_photos" ? "abnormal-photos" : "goods-photos";
    const { data, error } = await supabase.storage.from(bucket).download(row.storage_path);
    if (error) throw error;
    const blobId = current?.blobId ?? row.id;
    await db.transaction("rw", db.photos, db.blobs, async () => {
      await db.blobs.put({ id: blobId, mime: row.mime_type ?? data.type ?? "image/jpeg", data, createdAt: millis(row.client_created_at) ?? Date.now() });
      await db.photos.put({ id: row.id, ownerModule: entityType === "abnormal_photos" ? "abnormalities" : row.owner_module, ownerId: entityType === "abnormal_photos" ? row.abnormality_id : row.owner_id, kind: row.photo_kind ?? (entityType === "abnormal_photos" ? "Bất thường" : "Hàng"), blobId, note: row.note ?? "", createdAt: millis(row.client_created_at) ?? millis(row.created_at) ?? Date.now(), storagePath: row.storage_path });
    });
  } else if (entityType === "data_items") {
    await db.dataItems.put({ id: row.id, productCode: row.product_code, designCode: row.design_code ?? "", receivedAt: millis(row.received_at) ?? Date.now(), invoice: row.invoice ?? "", lot: row.lot ?? "", quantity: Number(row.quantity), status: row.status, note: row.note ?? "", createdAt: millis(row.client_created_at) ?? millis(row.created_at) ?? Date.now(), updatedAt: millis(row.client_updated_at) ?? millis(row.updated_at) ?? Date.now(), completedAt: millis(row.completed_at) });
  } else if (entityType === "goods_items") {
    await db.goodsItems.put({ id: row.id, invoice: row.invoice ?? "", itemCode: row.item_code ?? "", productCode: row.product_code ?? "", lot: row.lot ?? "", quantity: Number(row.quantity), exportDate: row.export_date, status: row.status, sourceKind: row.source_kind ?? "SEA", destination: row.destination ?? "", confirmation: row.confirmation ?? "", containerCount: row.container_count ?? 0, looseQuantity: row.loose_quantity ?? "", warehouse: row.warehouse ?? "", note: row.note ?? "", createdAt: millis(row.client_created_at) ?? millis(row.created_at) ?? Date.now(), updatedAt: millis(row.client_updated_at) ?? millis(row.updated_at) ?? Date.now() });
  } else if (entityType === "lots") {
    await db.lots.put({ id: row.id, lotCode: row.lot_code, invoice: row.invoice ?? "", productCode: row.product_code ?? "", date: row.work_date, quantity: Number(row.quantity), status: row.status, createdAt: millis(row.client_created_at) ?? millis(row.created_at) ?? Date.now() });
  } else {
    await db.lotClosures.put({ id: row.id, lotId: row.lot_id, closedBy: row.closed_by_name ?? "Cloud", closedAt: millis(row.closed_at) ?? Date.now(), note: row.note ?? "", photoId: row.local_photo_id ?? null });
  }
}
