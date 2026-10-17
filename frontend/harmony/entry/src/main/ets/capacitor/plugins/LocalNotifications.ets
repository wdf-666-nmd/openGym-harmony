import { reminderAgentManager } from '@kit.BackgroundTasksKit';
import { notificationManager } from '@kit.NotificationKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { CapacitorPlugin } from '../CapacitorPlugin';
import { PluginCall } from '../PluginCall';

/**
 * `@capacitor/local-notifications` — workout-day reminders.
 *
 * openGym's mobile build schedules one-off notifications per future calendar
 * date (mobile.js buildReminderNotifications / buildNudgeNotifications: a
 * 60-day window of workout-day reminders plus a 7-day window of missed-
 * workout nudges, each `{ id, title, body, schedule: { at } }`), then
 * re-syncs the whole window after every state change. The Capacitor surface
 * it needs is exactly: `schedule`, `cancel`, `checkPermissions`,
 * `requestPermissions`.
 *
 * HarmonyOS maps each one-off notification to a `ReminderRequestCalendar`
 * with no repeat fields — it fires once at the given wall-clock time and
 * disappears. `notificationId` carries the Capacitor id so `cancel` can
 * remove exactly the ones JS asks for. Cancel-all semantics (`cancel` with
 * every id in the window, as the JS re-sync does) is per-id
 * `cancelReminder`; there is no global "cancel everything" in the Capacitor
 * contract the app uses.
 */
/** `checkPermissions` / `requestPermissions` — Capacitor permission shape. */
interface PermissionStatusPayload {
  display: string;
}

export class LocalNotificationsPlugin extends CapacitorPlugin {
  getPluginId(): string {
    return 'LocalNotifications';
  }

  getMethods(): string[] {
    return ['schedule', 'cancel', 'checkPermissions', 'requestPermissions'];
  }

  /** Cancel every reminder whose notificationId the call lists. */
  cancel(call: PluginCall): void {
    const notifications: Object[] = call.getArray('notifications');
    const ids: number[] = [];
    notifications.forEach((n: Object) => {
      const rec = n as Record<string, Object>;
      const id = rec['id'];
      if (typeof id === 'number') {
        ids.push(id);
      }
    });
    let failed = 0;
    let done = 0;
    if (ids.length === 0) {
      call.resolve();
      return;
    }
    ids.forEach((id: number) => {
      reminderAgentManager.cancelReminder(id)
        .catch((e: BusinessError) => {
          // An unknown id is the normal case when the app re-syncs a window
          // it never scheduled (fresh install, clock moved): not an error.
          if (e.code !== 1700002) {
            failed += 1;
          }
        })
        .then(() => {
          done += 1;
          if (done === ids.length) {
            if (failed > 0) {
              call.reject(`cancel failed for ${failed} reminder(s)`);
            } else {
              call.resolve();
            }
          }
        });
    });
  }

  checkPermissions(call: PluginCall): void {
    notificationManager.isNotificationEnabled()
      .then((enabled: boolean) => {
        const status: PermissionStatusPayload = { display: enabled ? 'granted' : 'denied' };
        call.resolve(status);
      })
      .catch((e: BusinessError) => {
        call.reject(`checkPermissions failed: ${String(e)}`);
      });
  }

  requestPermissions(call: PluginCall): void {
    // `requestEnableNotification` pops the system dialog; when the user has
    // already granted, it resolves immediately. On refusal it rejects with
    // 1600004 — that is a "denied" answer, not a plugin failure.
    notificationManager.requestEnableNotification(this.context)
      .then(() => {
        const status: PermissionStatusPayload = { display: 'granted' };
        call.resolve(status);
      })
      .catch((e: BusinessError) => {
        if (e.code === 1600004) {
          const denied: PermissionStatusPayload = { display: 'denied' };
          call.resolve(denied);
          return;
        }
        const prompt: PermissionStatusPayload = { display: 'prompt' };
        call.resolve(prompt);
      });
  }

  /**
   * Schedule the window of one-off notifications. Each entry carries a
   * Capacitor `id` and an `schedule.at` epoch-millis timestamp; a
   * `ReminderRequestCalendar` with no repeat months/days fires exactly once.
   */
  schedule(call: PluginCall): void {
    const notifications: Object[] = call.getArray('notifications');
    if (notifications.length === 0) {
      call.resolve();
      return;
    }
    let scheduled = 0;
    let failed = 0;
    notifications.forEach((n: Object) => {
      const rec = n as Record<string, Object>;
      const id = rec['id'];
      const title = rec['title'];
      const body = rec['body'];
      const schedule = rec['schedule'] as Record<string, Object> | undefined;
      const at = schedule ? schedule['at'] : undefined;
      if (typeof id !== 'number' || typeof title !== 'string' || typeof body !== 'string' || typeof at !== 'number') {
        failed += 1;
        return;
      }
      const when = new Date(at);
      if (isNaN(when.getTime())) {
        failed += 1;
        return;
      }
      const reminder: reminderAgentManager.ReminderRequestCalendar = {
        reminderType: reminderAgentManager.ReminderType.REMINDER_TYPE_CALENDAR,
        notificationId: id,
        title: title,
        content: body,
        expiredContent: body,
        slotType: notificationManager.SlotType.SOCIAL_COMMUNICATION,
        dateTime: {
          year: when.getFullYear(),
          month: when.getMonth() + 1,
          day: when.getDate(),
          hour: when.getHours(),
          minute: when.getMinutes(),
          second: 0,
        },
      };
      reminderAgentManager.publishReminder(reminder)
        .then(() => {
          scheduled += 1;
        })
        .catch((e: BusinessError) => {
          failed += 1;
          console.error(`[LocalNotifications] publishReminder ${id} failed: ${JSON.stringify(e)}`);
        })
        .then(() => {
          if (scheduled + failed === notifications.length) {
            if (failed > 0) {
              call.reject(`schedule failed for ${failed} of ${notifications.length} notification(s)`);
            } else {
              call.resolve();
            }
          }
        });
    });
  }
}
