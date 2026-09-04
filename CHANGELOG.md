# Changelog

## v1.1.1 — 2026-09-01

- Android: Lưu backup bằng hộp chọn nơi lưu của hệ thống; chỉ báo thành công sau khi ghi file. Tách nút Chia sẻ, xử lý hủy và lỗi.
- Hiển thị và cho xuất tối đa 3 bản sao trước restore; giữ liên kết bản sao khi ghi đè cài đặt.
- Thông báo Android: xin quyền, kênh nhắc việc, gửi thử sau 10 giây; hẹn trước hạn và đến hạn kể cả khi app không mở. Cập nhật/hủy lịch khi sửa, hoàn thành, xóa hoặc khôi phục công việc.
- DATA và Lot phát thông báo hệ thống khi kiểm tra trong app. Android có thể trì hoãn báo giờ do tiết kiệm pin; buộc dừng app cần mở lại.
- Không đổi database schema, không thêm dịch vụ đồng bộ mạng.

## v1.0.1 — 2026-09-01

### Feature
- GitHub Actions build file **CongViecPro.apk** (Capacitor + Gradle).
- Workflow `Build APK`: test + web + artifact APK cài được trên Android.
- App chạy offline trong WebView, camera/QR, backup ZIP.

## v1.0.0 — 2026-09-01

### Feature
- Kiến trúc offline-first: IndexedDB (Dexie) tương đương Room, mọi nghiệp vụ ghi thật.
- Dashboard ca hiện tại, việc chưa xong, nhật ký ca, bàn giao ca.
- Nhân sự / nhóm / 4 ca (Ca 4 qua ngày) / chấm công vào-ra-nghỉ.
- Công việc, khối tùy biến, checklist, tiến độ slider, lịch sử audit, ảnh.
- OT / AMH tự tính giờ, gồm OT qua 00:00.
- DATA, hàng xuất, Lot, chốt Lot (không xóa lịch sử chốt).
- Quét QR/Barcode camera thật, tạo mới nếu chưa có mã.
- 3S/3D, bất thường, mail intent, báo cáo + biểu đồ.
- Backup ZIP (manifest + json + ảnh), preview, ghi đè / hợp nhất / bỏ trùng, auto-backup trước restore, chia sẻ.
- Phân quyền ADMIN / LEADER / USER / VIEWER trên máy.
- Dữ liệu mẫu lần đầu chạy, có nút xóa mẫu.
- Nhắc việc nền (deadline, DATA, Lot).

### Files
- `src/lib/cvp/*` domain + database + backup
- `src/routes/*` toàn bộ module
- `src/components/*` shell + camera + QR
- `.github/workflows/build.yml`
- `capacitor.config.ts`, `scripts/build-native.mjs`, `scripts/patch-android.mjs`

### Tests
- Ca đêm / OT qua ngày: 22:00→06:00, 22:00→01:00, 23:30→02:30
- Progress 100% → COMPLETED
- Duplicate detection
- Lot closing guards

### Database
- Schema version 1 (Dexie). Nâng cấp sau này dùng `db.version(n).stores(...)`, không xóa DB khi update.
