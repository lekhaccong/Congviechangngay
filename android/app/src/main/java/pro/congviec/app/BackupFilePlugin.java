package pro.congviec.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "BackupFile")
public class BackupFilePlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/zip");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("name", "congviecpro_backup.zip"));
        startActivityForResult(call, intent, "saved");
    }

    @ActivityCallback
    private void saved(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }
        Uri destination = result.getData().getData();
        getBridge().execute(() -> {
            try {
                String path = call.getString("path");
                if (path == null || destination == null) throw new Exception("Thiếu đường dẫn backup");
                File source = new File(Uri.parse(path).getPath()).getCanonicalFile();
                String cacheRoot = getContext().getCacheDir().getCanonicalPath() + File.separator;
                if (!source.getPath().startsWith(cacheRoot)) throw new Exception("File ngoài thư mục backup tạm");
                try (FileInputStream input = new FileInputStream(source);
                     OutputStream output = getContext().getContentResolver().openOutputStream(destination, "wt")) {
                    if (output == null) throw new Exception("Không mở được nơi lưu");
                    byte[] buffer = new byte[65536];
                    int count;
                    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                    output.flush();
                }
                JSObject response = new JSObject();
                response.put("cancelled", false);
                response.put("uri", destination.toString());
                call.resolve(response);
            } catch (Exception error) {
                call.reject("Không lưu được backup: " + error.getMessage(), error);
            }
        });
    }
}
