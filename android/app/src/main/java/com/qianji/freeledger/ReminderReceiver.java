package com.qianji.freeledger;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import java.util.Calendar;

public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences sp = context.getSharedPreferences(NotificationHelper.PREFS_NAME, Context.MODE_PRIVATE);
        String repeatDaysJson = sp.getString(NotificationHelper.KEY_REPEAT_DAYS, "[]");

        boolean shouldNotify = true;
        try {
            JSONArray daysArray = new JSONArray(repeatDaysJson);
            if (daysArray.length() > 0) {
                Calendar now = Calendar.getInstance();
                int dayOfWeek = now.get(Calendar.DAY_OF_WEEK);
                // Convert Android DAY_OF_WEEK: Sunday=1 -> 7, Monday=2 -> 1, ..., Saturday=7 -> 6
                int mappedDay = (dayOfWeek == Calendar.SUNDAY) ? 7 : (dayOfWeek - 1);

                shouldNotify = false;
                for (int i = 0; i < daysArray.length(); i++) {
                    if (daysArray.getInt(i) == mappedDay) {
                        shouldNotify = true;
                        break;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (shouldNotify) {
            NotificationHelper.showNotification(
                    context,
                    "极简记账 · 每日记账提醒",
                    "今天有哪些开销与收入呢？花几秒随手记一笔，账目更清晰～"
            );
        }

        // Schedule next alarm for the next day
        NotificationHelper.scheduleNextAlarm(context);
    }
}
