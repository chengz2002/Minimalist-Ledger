package com.qianji.freeledger;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.widget.RemoteViews;
import java.util.Locale;

public class Widget1x4 extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_1x4);

        float monthSpent = WidgetDataProvider.getMonthExpense(context);
        float budgetRemaining = WidgetDataProvider.getBudgetRemaining(context);
        float[] dailyTrend = WidgetDataProvider.getDailyTrend(context);

        // Month expense
        views.setTextViewText(R.id.tv_1x4_month_spent, String.format(Locale.CHINA, "¥%.2f", monthSpent));

        // Budget usage text
        if (budgetRemaining < 0) {
            views.setTextViewText(R.id.tv_1x4_budget_info, String.format(Locale.CHINA, "预算超支 ¥%.2f", Math.abs(budgetRemaining)));
            views.setTextColor(R.id.tv_1x4_budget_info, Color.parseColor("#EF4444"));
        } else {
            views.setTextViewText(R.id.tv_1x4_budget_info, String.format(Locale.CHINA, "预算剩余 ¥%.2f", budgetRemaining));
            views.setTextColor(R.id.tv_1x4_budget_info, Color.parseColor("#10B981"));
        }

        // Draw and set daily trend bar chart bitmap
        try {
            Bitmap chartBitmap = WidgetDataProvider.generateBarChartBitmap(context, 260, 80, dailyTrend);
            views.setImageViewBitmap(R.id.iv_1x4_chart, chartBitmap);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Tap to enter record screen directly
        PendingIntent recordIntent = WidgetDataProvider.createQuickRecordIntent(context);
        views.setOnClickPendingIntent(R.id.widget_1x4_container, recordIntent);
        views.setOnClickPendingIntent(R.id.btn_1x4_add, recordIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, Widget1x4.class));
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}
