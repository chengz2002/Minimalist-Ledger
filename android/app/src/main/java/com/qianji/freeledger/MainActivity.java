package com.qianji.freeledger;

import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    public String pendingAction = null;
    private long lastBackPressTime = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        NotificationHelper.createNotificationChannel(this);
        handleIntent(getIntent());
        setupWidgetBridge();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("action");
        if ("record".equals(action)) {
            pendingAction = "record";
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView webView = this.bridge.getWebView();
                webView.post(() -> {
                    webView.evaluateJavascript(
                        "if (window.triggerQuickRecord) { window.triggerQuickRecord(); } else { window.location.hash = 'record'; }",
                        null
                    );
                });
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.evaluateJavascript("window.handleAndroidBack ? window.handleAndroidBack() : false;", value -> {
                if (!"true".equals(value)) {
                    runOnUiThread(() -> {
                        long now = System.currentTimeMillis();
                        if (now - lastBackPressTime < 2000) {
                            finish();
                        } else {
                            lastBackPressTime = now;
                            Toast.makeText(MainActivity.this, "再按一次退出应用", Toast.LENGTH_SHORT).show();
                        }
                    });
                }
            });
            return;
        }
        super.onBackPressed();
    }

    private void setupWidgetBridge() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new WidgetBridge(this), "AndroidWidgetBridge");
        }
    }

    public static class WidgetBridge {
        private final MainActivity activity;

        public WidgetBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public String getPendingAction() {
            String act = activity.pendingAction;
            activity.pendingAction = null;
            return act != null ? act : "";
        }

        @JavascriptInterface
        public void updateWidgetData(String json) {
            WidgetDataProvider.updateData(activity, json);
        }

        @JavascriptInterface
        public void showNativeNotification(String title, String body) {
            activity.runOnUiThread(() -> {
                NotificationHelper.showNotification(activity, title, body);
            });
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            activity.runOnUiThread(() -> {
                NotificationHelper.requestPermission(activity);
            });
        }

        @JavascriptInterface
        public boolean isNotificationPermissionGranted() {
            return NotificationHelper.isPermissionGranted(activity);
        }

        @JavascriptInterface
        public void scheduleNativeReminder(String timeStr, String repeatDaysJson) {
            NotificationHelper.scheduleReminder(activity, timeStr, repeatDaysJson);
        }

        @JavascriptInterface
        public void cancelNativeReminder() {
            NotificationHelper.cancelReminder(activity);
        }

        @JavascriptInterface
        public String saveFileToDownloads(String fileName, String content, String mimeType) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType != null && !mimeType.isEmpty() ? mimeType : "text/plain");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/极简记账");

                    Uri uri = activity.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        OutputStream os = activity.getContentResolver().openOutputStream(uri);
                        if (os != null) {
                            os.write(content.getBytes(StandardCharsets.UTF_8));
                            os.flush();
                            os.close();
                            return "内部存储/Download/极简记账/" + fileName;
                        }
                    }
                }

                File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File targetDir = new File(downloadDir, "极简记账");
                if (!targetDir.exists()) {
                    targetDir.mkdirs();
                }
                File file = new File(targetDir, fileName);
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(content.getBytes(StandardCharsets.UTF_8));
                fos.flush();
                fos.close();
                return file.getAbsolutePath();
            } catch (Exception e) {
                e.printStackTrace();
                return "";
            }
        }
    }
}
