import { ReminderConfig } from '../types/ledger';
import { formatLocalDate } from './storageService';

class NotificationService {
  private timerId: number | null = null;
  private onInAppNotificationCallback: ((title: string, body: string) => void) | null = null;

  public setInAppCallback(cb: (title: string, body: string) => void) {
    this.onInAppNotificationCallback = cb;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  public sendNotification(title: string, body: string) {
    // 1. In-app banner
    if (this.onInAppNotificationCallback) {
      this.onInAppNotificationCallback(title, body);
    }

    // 2. System / Web notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn('Notification display failed', e);
      }
    }
  }

  public startScheduler(
    getReminder: () => ReminderConfig,
    updateReminder: (updater: (prev: ReminderConfig) => ReminderConfig) => void
  ) {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    // Check once every 30 seconds
    this.timerId = window.setInterval(() => {
      const reminder = getReminder();
      if (!reminder || !reminder.enabled) return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Convert day: 0 (Sun) -> 7, 1 (Mon) -> 1 ... 6 (Sat) -> 6
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const todayDateStr = formatLocalDate(now);

      // Check if time matches, day of week matches, and not triggered today yet
      if (
        reminder.time === currentTimeStr &&
        reminder.repeatDays.includes(dayOfWeek) &&
        reminder.lastTriggeredDate !== todayDateStr
      ) {
        this.sendNotification('极简记账 · 每日记账提醒', '今天有新的开销或收入吗？随手花几秒记一笔，账目更清晰～');
        updateReminder(prev => ({
          ...prev,
          lastTriggeredDate: todayDateStr,
        }));
      }
    }, 30000);
  }

  public stopScheduler() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const notificationService = new NotificationService();
