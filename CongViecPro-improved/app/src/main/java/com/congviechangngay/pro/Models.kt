package com.congviechangngay.pro

val TASK_NAMES = listOf(
    "Chấm công đầu giờ",
    "Khai báo nhân sự lên 2 nhóm",
    "Kiểm tra Checksheet và ký",
    "Phân chia công việc và tính làm thêm",
    "Nhập vào file theo dõi làm thêm và AMH",
    "Khai làm thêm trên hệ thống",
    "Kiểm tra hàng xuất",
    "Chốt lô / báo cáo hoàn thành lô bằng mail",
    "Kiểm tra hàng DATA",
    "Check mail và xử lý thông tin liên quan",
    "Kiểm tra vệ sinh, 3S, 3D",
    "Kiểm tra tồn kho thùng, bao bì, kệ gỗ",
    "Tính nhân sự đi làm ngày nghỉ và sang tuần",
    "Khai ca nhân sự tuần sau và làm thêm ngày nghỉ",
    "Kiểm tra giao hàng bóc tách",
    "Kiểm tra hàng không ngày mai",
    "Kiểm tra hiểu biết về bất thường và tuân thủ công nhân",
    "Kiểm tra Todo List và liên hệ các bên liên quan"
)

enum class Shift(val label: String, val start: Int, val end: Int) {
    MORNING("Ca sáng", 6, 14),
    OFFICE("Ca hành chính", 8, 17),
    AFTERNOON("Ca chiều", 14, 22),
    NIGHT("Ca đêm", 22, 6)
}

data class DailyTask(
    val id: Long, val number: Int, val title: String, val date: String, val shift: String,
    val status: String, val started: Long?, val finished: Long?, val minutes: Int,
    val note: String, val problem: Boolean
)

data class Todo(
    val id: Long, val title: String, val detail: String, val related: String,
    val created: String, val due: String, val progress: Int, val priority: String, val status: String
)

data class Attachment(val id: Long, val ownerType: String, val ownerId: Long, val path: String)

data class Person(
    val id: Long, val name: String, val groupName: String, val shift: String, val date: String, val ot: Double
)

data class OtRecord(
    val id: Long, val date: String, val name: String, val hours: Double, val reason: String, val status: String
)

data class AmhRecord(val id: Long, val date: String, val code: String, val qty: Int, val note: String)

data class Shipment(
    val id: Long, val date: String, val code: String, val invoice: String, val qty: Int, val status: String, val note: String
)

data class DataRecord(
    val id: Long, val date: String, val code: String, val design: String, val qty: Int, val status: String, val note: String
)

data class LotRecord(
    val id: Long, val date: String, val lot: String, val code: String, val status: String, val emailTo: String, val note: String
)

data class MailRecord(
    val id: Long, val date: String, val subject: String, val sender: String, val status: String, val note: String
)
