export type ReminderSettings = {
  enabled: boolean;
  paused: boolean;
  weekdays: number[];
  hour: number;
  minute: number;
};

export type ReminderPermission = {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
};

export type ReminderNotifications<TTriggerType> = {
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  scheduleNotificationAsync: (request: {
    content: {
      title: string;
      body: string;
      data: typeof REMINDER_DATA;
    };
    trigger: {
      type: TTriggerType;
      weekday: number;
      hour: number;
      minute: number;
    };
  }) => Promise<unknown>;
};

export const REMINDER_DATA = { destination: 'today', refreshRecommendation: true } as const;

export async function syncReminderSchedule<TTriggerType>(
  settings: ReminderSettings,
  notifications: ReminderNotifications<TTriggerType>,
  weeklyTriggerType: TTriggerType,
) {
  await notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled || settings.paused) return;

  for (const weekday of settings.weekdays) {
    await notifications.scheduleNotificationAsync({
      content: {
        title: 'Your practice is ready',
        body: 'Open Today for a focused next action.',
        data: REMINDER_DATA,
      },
      trigger: {
        type: weeklyTriggerType,
        weekday,
        hour: settings.hour,
        minute: settings.minute,
      },
    });
  }
}

export async function requestReminderPermissionAfterEnable(
  getPermissions: () => Promise<ReminderPermission>,
  requestPermissions: () => Promise<ReminderPermission>,
) {
  let permission = await getPermissions();
  if (!permission.granted && permission.canAskAgain) {
    permission = await requestPermissions();
  }
  return permission;
}

export function getReminderNavigationTarget(data: Record<string, unknown> | undefined) {
  if (data?.destination !== 'today') return null;
  return {
    pathname: '/(tabs)' as const,
    params: { reminder: String(Date.now()) },
  };
}

export async function refreshRecommendationFromReminder<T>(
  refetch: () => Promise<{ data?: T }>,
  recommend: (data: T) => void,
) {
  const { data } = await refetch();
  if (data) recommend(data);
}