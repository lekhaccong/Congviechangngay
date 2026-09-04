# CongViecPro

App quản lý ca — nhân sự, công việc, DATA, hàng xuất, Lot, OT, backup. Chạy offline trên điện thoại (IndexedDB).

## Tạo file APK trên GitHub

1. Đẩy repo này lên GitHub (branch `main` hoặc `master`).
2. Mở tab **Actions** → workflow **Build APK** → **Run workflow**.
3. Đợi job **Android APK** xong (vài phút lần đầu).
4. Tải artifact **CongViecPro-apk**, giải nén lấy `CongViecPro.apk`.
5. Trên Android: Settings → cho phép cài từ nguồn không xác định → mở file APK.

App **không cần Play Store**. File debug APK đã ký, cài trực tiếp được.

Mỗi lần push lên `main`/`master` GitHub tự build lại APK.

### Quyền trên điện thoại

- Camera: quét QR / barcode
- Ảnh / bộ nhớ: backup ZIP
- Thông báo: nhắc việc, Lot, DATA

### Gói web (tùy chọn)

Job **Test & web build** cũng chạy test + `npm run build` (deploy Vercel / hosting).

## Chạy local (web)

```bash
npm ci
npm run dev
```

## Build APK local (cần Android SDK + JDK 21)

```bash
npm ci
npm run build:native
npx cap add android   # lần đầu
npx cap sync android
node scripts/patch-android.mjs
cd android && ./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Môi trường chạy thử

CongViecPro có sẵn preview kiểu sandbox để kiểm tra bản web trước khi đóng gói APK:

```bash
npm ci
npm run build:native
npm run preview:restart
npm run sandbox:smoke
```

Preview local: `http://127.0.0.1:8081/`.

Trên GitHub, workflow **Web Preview** sẽ build `native-www` và triển khai thành trang xem thử bằng GitHub Pages. Workflow **Build APK** vẫn tạo artifact `CongViecPro.apk`.
