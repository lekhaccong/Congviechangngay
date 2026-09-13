import * as XLSX from "xlsx";
import { BUSINESS_SHIFT_RULES } from "./business-shifts.ts";
import type { Attendance, Employee, MonthlyPayroll, Overtime, WorkSchedule } from "./types.ts";
import { datesInRange } from "./time.ts";

export function monthBounds(month: string) {
  const [year, value] = month.split("-").map(Number);
  const last = new Date(year, value, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

export function payrollStats(employeeId: string, schedules: WorkSchedule[], attendance: Attendance[], overtimes: Overtime[]) {
  const personSchedules = schedules.filter((row) => row.employeeId === employeeId);
  const personAttendance = attendance.filter((row) => row.employeeId === employeeId && (row.status === "PRESENT" || row.status === "LATE"));
  const dayWork = personAttendance.filter((row) => row.actualShiftCode !== "D" && row.actualShiftCode !== "E").length;
  const nightWork = personAttendance.length - dayWork;
  const leave = personSchedules.filter((row) => !BUSINESS_SHIFT_RULES[row.shiftCode].working).length;
  const ot = overtimes.filter((row) => row.employeeId === employeeId && row.attendanceConfirmedAt);
  const otDay = ot.filter((row) => !["D", "E"].includes(personSchedules.find((s) => s.date === row.date)?.shiftCode ?? "")).reduce((sum, row) => sum + row.totalMinutes, 0) / 60;
  const otNight = ot.reduce((sum, row) => sum + row.totalMinutes, 0) / 60 - otDay;
  const lateMinutes = personAttendance.reduce((sum, row) => sum + (row.lateMinutes ?? 0), 0);
  return { dayWork, nightWork, leave, otDay, otNight, lateMinutes };
}

export function exportAttendanceWorkbook(input: { month: string; employees: Employee[]; schedules: WorkSchedule[]; attendance: Attendance[]; overtimes: Overtime[]; payroll: MonthlyPayroll[] }) {
  const { from, to } = monthBounds(input.month);
  const dates = datesInRange(from, to);
  const detail = [["SBD", "Họ tên", "Ngày", "Ca", "Trạng thái", "Muộn (phút)", "OT (giờ)"]];
  for (const person of input.employees) for (const date of dates) {
    const schedule = input.schedules.find((row) => row.employeeId === person.id && row.date === date);
    const attendance = input.attendance.find((row) => row.employeeId === person.id && row.date === date);
    const otHours = input.overtimes.filter((row) => row.employeeId === person.id && row.date === date && row.attendanceConfirmedAt).reduce((sum, row) => sum + row.totalMinutes, 0) / 60;
    if (schedule || attendance || otHours) detail.push([person.code, person.name, date, attendance?.actualShiftCode ?? schedule?.shiftCode ?? "", attendance?.status ?? (schedule ? "Chưa chấm" : ""), attendance?.lateMinutes ?? 0, otHours] as never);
  }
  const summary = [["SBD", "Họ tên", "Công ngày", "Công đêm", "Ngày nghỉ", "Muộn (phút)", "OT ngày", "OT đêm", "Điểm đánh giá", "Chuyên cần", "PC trách nhiệm", "PC lương", "PC khu vực", "PC khác", "Tạm ứng", "Điều chỉnh quyết toán", "Tổng khoản tháng"]];
  for (const person of input.employees) {
    const stats = payrollStats(person.id, input.schedules, input.attendance, input.overtimes);
    const pay = input.payroll.find((row) => row.employeeId === person.id);
    const total = (pay?.attendanceAllowance ?? 0) + (pay?.responsibilityAllowance ?? 0) + (pay?.salaryAllowance ?? 0) + (pay?.areaAllowance ?? 0) + (pay?.otherAllowance ?? 0) - (pay?.advance ?? 0) + (pay?.settlementAdjustment ?? 0);
    summary.push([person.code, person.name, stats.dayWork, stats.nightWork, stats.leave, stats.lateMinutes, stats.otDay, stats.otNight, pay?.performanceScore ?? 0, pay?.attendanceAllowance ?? 0, pay?.responsibilityAllowance ?? 0, pay?.salaryAllowance ?? 0, pay?.areaAllowance ?? 0, pay?.otherAllowance ?? 0, pay?.advance ?? 0, pay?.settlementAdjustment ?? 0, total] as never);
  }
  const otRows = [["SBD", "Họ tên", "Ngày", "Từ", "Đến", "Số giờ", "Hệ số", "Loại", "Xác nhận"]];
  for (const row of input.overtimes) {
    const person = input.employees.find((item) => item.id === row.employeeId);
    if (person) otRows.push([person.code, person.name, row.date, row.startTime, row.endTime, row.totalMinutes / 60, row.ratePercent ?? "", row.type, row.attendanceConfirmedAt ? "Đã xác nhận" : "Chờ"] as never);
  }
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of [["Bảng công", detail], ["Tổng hợp", summary], ["OT", otRows]] as const) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = rows[0].map((_, index) => ({ wch: index === 1 ? 24 : 14 }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const url = URL.createObjectURL(new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `bang-cong-ot-${input.month}.xlsx`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
