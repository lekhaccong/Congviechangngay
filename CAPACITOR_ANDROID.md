# Hướng dẫn build APK với Capacitor (CongViecPro)

## Yêu cầu trên máy của bạn

1. **Node.js 20+** và npm
2. **Android Studio** (khuyến nghị mới nhất)
3. **JDK 17** hoặc 21
4. Android SDK (cài qua Android Studio):
   - Android SDK Platform 34 hoặc 35
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

## Các bước thực hiện

### 1. Cài đặt dependencies

```bash
cd workspace   # thư mục project
npm install
```

### 2. Build web app

```bash
npm run build
```

> **Lưu ý quan trọng**: Project dùng TanStack Start + Nitro (SSR).  
> Capacitor cần thư mục `dist` chứa file tĩnh (HTML/JS/CSS).  
> Nếu `npm run build` tạo ra output SSR (không có `index.html` thuần trong `dist`), bạn có thể cần:
> - Thêm cấu hình SPA mode, hoặc
> - Dùng `vite build --ssr false` / điều chỉnh nitro preset, hoặc
> - Copy client assets thủ công.

Sau khi build thành công, kiểm tra thư mục `dist` phải có `index.html`.

### 3. Thêm platform Android (chỉ chạy 1 lần)

```bash
npx cap add android
```

### 4. Đồng bộ code web → Android

```bash
npx cap sync android
# hoặc
npm run build:android
```

### 5. Mở Android Studio và build APK

```bash
npx cap open android
```

Trong Android Studio:

1. Chờ Gradle sync xong.
2. Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. File APK sẽ nằm ở:  
   `android/app/build/outputs/apk/debug/app-debug.apk`

### 6. (Tuỳ chọn) Build release APK / AAB

- Tạo keystore:
  ```bash
  keytool -genkey -v -keystore congviecpro.keystore -alias congviecpro -keyalg RSA -keysize 2048 -validity 10000
  ```
- Cấu hình signing trong `android/app/build.gradle`.
- Build → Generate Signed Bundle / APK.

## Cấu hình đã chuẩn bị sẵn

- `capacitor.config.ts` với:
  - `appId`: `com.congviecpro.app`
  - `appName`: `CongViecPro`
  - `webDir`: `dist`
  - Theme tối (#0C0D0F) khớp với app
  - Splash screen & StatusBar

## Troubleshooting

| Lỗi | Cách xử lý |
|-----|-----------|
| `dist` không có `index.html` | Kiểm tra lại `npm run build`. Có thể cần force client-side build. |
| Gradle sync fail | Mở Android Studio → File → Invalidate Caches. Cài đúng SDK. |
| White screen khi mở app | Kiểm tra `androidScheme`, CORS, hoặc base path trong vite.config. |
| Camera / QR không hoạt động | Thêm permission trong `AndroidManifest.xml` và dùng plugin Capacitor phù hợp. |

## Chạy trên thiết bị thật

1. Bật **Developer options** + **USB debugging** trên điện thoại.
2. Cắm USB → Android Studio sẽ nhận device.
3. Nhấn Run (▶).

Chúc bạn build thành công APK!
