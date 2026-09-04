//#region src/lib/cvp/types.ts
var APP_NAME = "CongViecPro";
var APP_VERSION = "1.0.0";
var TASK_STATUS_LABEL = {
	TODO: "Chưa làm",
	IN_PROGRESS: "Đang làm",
	PAUSED: "Tạm dừng",
	COMPLETED: "Hoàn thành",
	OVERDUE: "Quá hạn"
};
var DATA_STATUS_LABEL = {
	NEW: "Mới",
	PROCESSING: "Đang xử lý",
	ENOUGH: "Đủ",
	MISSING: "Thiếu",
	PUSHED: "Đã đẩy",
	COMPLETED: "Hoàn thành"
};
var GOODS_STATUS_LABEL = {
	WAITING: "Chờ",
	PREPARING: "Đang chuẩn bị",
	ENOUGH: "Đủ",
	MISSING: "Thiếu",
	PROCESSING: "Đang xử lý",
	COMPLETED: "Hoàn thành"
};
var LOT_STATUS_LABEL = {
	OPEN: "Chưa chốt",
	PROCESSING: "Đang xử lý",
	ENOUGH: "Đủ",
	CLOSED: "Đã chốt"
};
var ABNORMAL_STATUS_LABEL = {
	NEW: "Mới",
	PROCESSING: "Đang xử lý",
	RESOLVED: "Đã xử lý",
	CLOSED: "Đóng"
};
var ATTENDANCE_STATUS_LABEL = {
	PRESENT: "Có mặt",
	ABSENT: "Nghỉ",
	LATE: "Đi muộn",
	EARLY_LEAVE: "Về sớm",
	OVERTIME: "Làm thêm",
	CHECKED_IN: "Đã vào"
};
var EMPLOYEE_STATUS_LABEL = {
	ACTIVE: "Đang làm",
	LEAVE: "Nghỉ",
	SUSPENDED: "Tạm hoãn"
};
var ROLE_LABEL = {
	ADMIN: "Quản trị",
	LEADER: "Tổ trưởng",
	USER: "Nhân sự",
	VIEWER: "Chỉ xem"
};
var AMH_STATUS_LABEL = {
	DECLARED: "Đã khai",
	APPROVED: "Duyệt",
	REJECTED: "Từ chối",
	DONE: "Xong"
};
var SEVERITY_LABEL = {
	LOW: "Thấp",
	MEDIUM: "Trung bình",
	HIGH: "Cao",
	CRITICAL: "Nghiêm trọng"
};
var OT_TYPES = [
	"Ngày thường",
	"Cuối tuần",
	"Lễ",
	"Ca đêm",
	"AMH"
];
var PHOTO_KINDS = [
	"Trước",
	"Trong quá trình",
	"Sau",
	"Bất thường",
	"Hàng",
	"Lot",
	"Khác"
];
var ABNORMAL_TYPES = [
	"DATA thiếu",
	"Hàng thiếu",
	"Lot lỗi",
	"3S / 3D",
	"Máy / thiết bị",
	"An toàn",
	"Khác"
];
//#endregion
export { APP_VERSION as a, EMPLOYEE_STATUS_LABEL as c, OT_TYPES as d, PHOTO_KINDS as f, TASK_STATUS_LABEL as h, APP_NAME as i, GOODS_STATUS_LABEL as l, SEVERITY_LABEL as m, ABNORMAL_TYPES as n, ATTENDANCE_STATUS_LABEL as o, ROLE_LABEL as p, AMH_STATUS_LABEL as r, DATA_STATUS_LABEL as s, ABNORMAL_STATUS_LABEL as t, LOT_STATUS_LABEL as u };
