package com.qianji.freeledger;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Color;
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

        // Format today and month spending
        views.setTextViewText(R.id.tv_2x2_today_spent, String.format(Locale.CHINA, "¥%.2f", todaySpent));
        views.setTextViewText(R.id.tv_2x2_month_spent, String.format(Locale.CHINA, "¥%.2f", monthSpent));

        // Format budget remaining and percent
        if (budgetTotal > 0) {
            float percent = Math.min((monthSpent / budgetTotal) * 100f, 999f);
            views.setTextViewText(R.id.tv_2x2_budget_percent, String.format(Locale.CHINA, "已用 %.1f%%", percent));
        } else {
            views.setTextViewText(R.id.tv_2x2_budget_percent, "未设上限");
        }

        if (budgetRemaining < 0) {
            views.setTextViewText(R.id.tv_2x2_budget_remaining, String.format(Locale.CHINA, "已超支 ¥%.2f", Math.abs(budgetRemaining)));
            views.setTextColor(R.id.tv_2x2_budget_remaining, Color.parseColor("#EF4444"));
        } else {
            views.setTextViewText(R.id.tv_2x2_budget_remaining, String.format(Locale.CHINA, "¥%.2f", budgetRemaining));
            views.setTextColor(R.id.tv_2x2_budget_remaining, Color.parseColor("#10B981"));
        }

        // Tap on widget or button to open record screen directly
        PendingIntent recordIntent = WidgetDataProvider.createQuickRecordIntent(context);
        views.setOnClickPendingIntent(R.id.widget_2x2_container, recordIntent);
        views.setOnClickPendingIntent(R.id.btn_2x2_add, recordIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, Widget2x2.class));
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}
