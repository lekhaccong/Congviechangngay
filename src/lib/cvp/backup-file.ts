import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const BackupFile = registerPlugin<{
  save(options: { path: string; name: string }): Promise<{ cancelled: boolean; uri?: string }>;
}>("BackupFile");

async function cacheBackup(blob: Blob, name: string) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được file backup"));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(blob);
  });
  const path = `backups/${name}`;
  const result = await Filesystem.writeFile({ path, data, directory: Directory.Cache, recursive: true });
  return { path, uri: result.uri };
}

export async function saveBackupFile(blob: Blob, name: string): Promise<string | null> {
  if (Capacitor.getPlatform() === "android") {
    const cached = await cacheBackup(blob, name);
    try {
      const result = await BackupFile.save({ path: cached.uri, name });
      return result.cancelled ? null : `Đã lưu ${name} vào thư mục bạn chọn.`;
    } finally {
      await Filesystem.deleteFile({ path: cached.path, directory: Directory.Cache }).catch(() => {});
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return `Đã gửi ${name} tới trình duyệt. Xem mục Tải xuống hoặc thư mục bạn chọn.`;
}

export async function shareBackupFile(blob: Blob, name: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const cached = await cacheBackup(blob, name);
    // The receiving app can read the shared URI asynchronously; Android owns cache cleanup.
    await Share.share({ files: [cached.uri], title: name, dialogTitle: "Chia sẻ bản sao lưu" });
    return;
  }
  const file = new File([blob], name, { type: "application/zip" });
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
    throw new Error("Trình duyệt này chưa hỗ trợ chia sẻ file. Hãy dùng Lưu backup.");
  }
  await navigator.share({ files: [file], title: name });
}
