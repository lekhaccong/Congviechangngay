# Công việc Pro (Improved)

Ứng dụng quản lý công việc hàng ngày – phiên bản source đã cải thiện.

## Cải thiện so với source GitHub gốc

| Trước | Sau |
|-------|-----|
| 1 file monolithic minified | Tách **Models.kt**, **AppDb.kt**, **Utils.kt**, **MainActivity.kt** |
| Package `com.example...` | `com.congviechangngay.pro` (giống bản Pro) |
| Version 4.0 | **2.0.0** (đồng bộ Pro APK) |
| Target SDK 35 | **36** |
| Code khó đọc | Database + Models format rõ ràng |

## Cấu trúc

```
app/src/main/java/com/congviechangngay/pro/
├── Models.kt       # Data classes + TASK_NAMES + Shift
├── AppDb.kt        # SQLite (daily tasks, todos, OT, AMH, shipments...)
├── Utils.kt        # today(), elapsed(), shareText(), sendEmail()
└── MainActivity.kt # UI Compose (5 tab)
```

## Build

Cần Android Studio hoặc Gradle:

```bash
./gradlew assembleDebug
```

## Ghi chú

- Logic nghiệp vụ giữ nguyên từ bản GitHub.
- Kiến trúc đã tách layer (Models / DB / UI) – bước tiến gần bản Pro (MVVM).
- Bước tiếp theo có thể thêm ViewModel + Repository như bản Pro APK.
