package com.qianji.freeledger;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Color;
import android.util.TypedValue;
import android.widget.RemoteViews;
import java.util.Locale;

public class Widget2x2 extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_2x2);

        float todaySpent = WidgetDataProvider.getTodayExpense(context);
        float monthSpent = WidgetDataProvider.getMonthExpense(context);
        float budgetTotal = WidgetDataProvider.getBudgetTotal(context);
        float budgetRemaining = WidgetDataProvider.getBudgetRemaining(context);

        // Smart format today and month spending
        String todayStr = formatMoney(todaySpent);
        String monthStr = formatMoney(monthSpent);
        views.setTextViewText(R.id.tv_2x2_today_spent, todayStr);
        views.setTextViewText(R.id.tv_2x2_month_spent, monthStr);

        // Dynamic auto-sizing font according to text length
        adjustTextSize(views, R.id.tv_2x2_today_spent, todayStr.length(), 15f, 13f, 11f);
        adjustTextSize(views, R.id.tv_2x2_month_spent, monthStr.length(), 15f, 13f, 11f);

        // Format budget remaining and percent
        if (budgetTotal > 0) {
            float percent = Math.min((monthSpent / budgetTotal) * 100f, 999f);
            views.setTextViewText(R.id.tv_2x2_budget_percent, String.format(Locale.CHINA, "已用 %.0f%%", percent));
        } else {
            views.setTextViewText(R.id.tv_2x2_budget_percent, "未设上限");
        }

        String remainStr;
        if (budgetRemaining < 0) {
            remainStr = "超支 " + formatMoney(Math.abs(budgetRemaining));
            views.setTextColor(R.id.tv_2x2_budget_remaining, Color.parseColor("#EF4444"));
        } else {
            remainStr = "剩 " + formatMoney(budgetRemaining);
            views.setTextColor(R.id.tv_2x2_budget_remaining, Color.parseColor("#10B981"));
        }
        views.setTextViewText(R.id.tv_2x2_budget_remaining, remainStr);
        adjustTextSize(views, R.id.tv_2x2_budget_remaining, remainStr.length(), 13f, 11.5f, 10f);

        // Tap on widget or button to open record screen directly
        PendingIntent recordIntent = WidgetDataProvider.createQuickRecordIntent(context);
        views.setOnClickPendingIntent(R.id.widget_2x2_container, recordIntent);
        views.setOnClickPendingIntent(R.id.btn_2x2_add, recordIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static String formatMoney(float amount) {
        if (amount >= 100000) {
            return String.format(Locale.CHINA, "¥%.1f万", amount / 10000f);
        } else if (amount >= 10000) {
            return String.format(Locale.CHINA, "¥%.0f", amount);
        } else if (amount >= 1000) {
            if (amount % 1 == 0) {
                return String.format(Locale.CHINA, "¥%.0f", amount);
            } else {
                return String.format(Locale.CHINA, "¥%.1f", amount);
            }
        } else {
            return String.format(Locale.CHINA, "¥%.2f", amount);
        }
    }

    private static void adjustTextSize(RemoteViews views, int viewId, int length, float baseSize, float medSize, float smallSize) {
        if (length <= 6) {
            views.setTextViewTextSize(viewId, TypedValue.COMPLEX_UNIT_SP, baseSize);
        } else if (length <= 8) {
            views.setTextViewTextSize(viewId, TypedValue.COMPLEX_UNIT_SP, medSize);
        } else {
            views.setTextViewTextSize(viewId, TypedValue.COMPLEX_UNIT_SP, smallSize);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, Widget2x2.class));
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}
