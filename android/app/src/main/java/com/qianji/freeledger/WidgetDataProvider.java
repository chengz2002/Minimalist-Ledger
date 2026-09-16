package com.qianji.freeledger;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Locale;

public class WidgetDataProvider {
    private static final String PREFS_NAME = "com.qianji.freeledger.widget_data";
    private static final String KEY_TODAY_EXPENSE = "today_expense";
    private static final String KEY_MONTH_EXPENSE = "month_expense";
    private static final String KEY_BUDGET_TOTAL = "budget_total";
    private static final String KEY_BUDGET_REMAINING = "budget_remaining";
    private static final String KEY_DAILY_TREND = "daily_trend";

    public static void updateData(Context context, String jsonStr) {
        if (context == null || jsonStr == null) return;
        try {
            JSONObject obj = new JSONObject(jsonStr);
            double today = obj.optDouble("todayExpense", 0.0);
            double month = obj.optDouble("monthExpense", 0.0);
            double budgetTotal = obj.optDouble("budgetTotal", 0.0);
            double budgetRemaining = obj.optDouble("budgetRemaining", budgetTotal - month);
            JSONArray trendArray = obj.optJSONArray("dailyTrend");

            SharedPreferences sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sp.edit();
            editor.putFloat(KEY_TODAY_EXPENSE, (float) today);
            editor.putFloat(KEY_MONTH_EXPENSE, (float) month);
            editor.putFloat(KEY_BUDGET_TOTAL, (float) budgetTotal);
            editor.putFloat(KEY_BUDGET_REMAINING, (float) budgetRemaining);
            if (trendArray != null) {
                editor.putString(KEY_DAILY_TREND, trendArray.toString());
            }
            editor.apply();

            // Notify all widgets to update immediately
            Widget2x2.updateAllWidgets(context);
            Widget1x4.updateAllWidgets(context);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static float getTodayExpense(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getFloat(KEY_TODAY_EXPENSE, 0.0f);
    }

    public static float getMonthExpense(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getFloat(KEY_MONTH_EXPENSE, 0.0f);
    }

    public static float getBudgetTotal(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getFloat(KEY_BUDGET_TOTAL, 0.0f);
    }

    public static float getBudgetRemaining(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getFloat(KEY_BUDGET_REMAINING, 0.0f);
    }

    public static float[] getDailyTrend(Context context) {
        float[] defaults = new float[]{0f, 0f, 0f, 0f, 0f, 0f, 0f};
        String json = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(KEY_DAILY_TREND, null);
        if (json == null) return defaults;
        try {
            JSONArray arr = new JSONArray(json);
            int len = Math.min(arr.length(), 7);
            float[] result = new float[7];
            int offset = 7 - len;
            for (int i = 0; i < len; i++) {
                result[offset + i] = (float) arr.optDouble(i, 0.0);
            }
            return result;
        } catch (Exception e) {
            return defaults;
        }
    }

    public static PendingIntent createQuickRecordIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("com.qianji.freeledger.ACTION_RECORD");
        intent.putExtra("action", "record");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        return PendingIntent.getActivity(
                context,
                1001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    /**
     * Draw daily spending bar chart onto a Bitmap for RemoteViews
     */
    public static Bitmap generateBarChartBitmap(Context context, int widthPx, int heightPx, float[] dailyValues) {
        if (widthPx <= 0) widthPx = 280;
        if (heightPx <= 0) heightPx = 90;

        Bitmap bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        if (dailyValues == null || dailyValues.length == 0) {
            dailyValues = new float[]{0f, 0f, 0f, 0f, 0f, 0f, 0f};
        }

        int count = dailyValues.length;
        float maxVal = 10.0f;
        for (float v : dailyValues) {
            if (v > maxVal) maxVal = v;
        }

        Paint barPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint todayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint baselinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        barPaint.setColor(Color.parseColor("#3B82F6")); // Blue-500
        todayPaint.setColor(Color.parseColor("#60A5FA")); // Blue-400 highlight
        baselinePaint.setColor(Color.parseColor("#2D3748")); // Baseline subtle line

        float paddingLeft = 6f;
        float paddingRight = 6f;
        float paddingTop = 8f;
        float paddingBottom = 6f;

        float availableW = widthPx - paddingLeft - paddingRight;
        float availableH = heightPx - paddingTop - paddingBottom;

        float spacing = availableW / (count * 4.5f);
        float barWidth = (availableW - (count - 1) * spacing) / count;
        float cornerRadius = Math.min(barWidth / 2f, 8f);

        for (int i = 0; i < count; i++) {
            float val = dailyValues[i];
            float left = paddingLeft + i * (barWidth + spacing);
            float right = left + barWidth;
            float bottom = heightPx - paddingBottom;

            // Draw faint baseline dot/slot
            RectF baseRect = new RectF(left, bottom - 3f, right, bottom);
            canvas.drawRoundRect(baseRect, 2f, 2f, baselinePaint);

            if (val > 0.001f) {
                float barH = Math.max((val / maxVal) * availableH, 5f);
                float top = bottom - barH;
                RectF barRect = new RectF(left, top, right, bottom);
                Paint p = (i == count - 1) ? todayPaint : barPaint;
                canvas.drawRoundRect(barRect, cornerRadius, cornerRadius, p);
            }
        }

        return bitmap;
    }
}
