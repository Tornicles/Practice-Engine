export type ReminderSettings = {
  enabled: boolean;
  paused: boolean;
  weekdays: number[];
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  paused: false,
  weekdays: [2, 3, 4, 5, 6],
  hour: 9,
  minute: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseReminderSettings(saved: string | null): ReminderSettings {
  let parsed: unknown;

  try {
    parsed = saved === null ? null : JSON.parse(saved);
  } catch {
    parsed = null;
  }

  if (!isRecord(parsed)) {
    return { ...DEFAULT_REMINDER_SETTINGS, weekdays: [...DEFAULT_REMINDER_SETTINGS.weekdays] };
  }

  const validWeekdays = Array.isArray(parsed.weekdays)
    ? [...new Set(parsed.weekdays.filter(
      (weekday): weekday is number =>
        Number.isInteger(weekday) && weekday >= 1 && weekday <= 7,
    ))].sort((left, right) => left - right)
    : [];

  return {
    enabled: typeof parsed.enabled === 'boolean'
      ? parsed.enabled
      : DEFAULT_REMINDER_SETTINGS.enabled,
    paused: typeof parsed.paused === 'boolean'
      ? parsed.paused
      : DEFAULT_REMINDER_SETTINGS.paused,
    weekdays: validWeekdays.length > 0
      ? validWeekdays
      : [...DEFAULT_REMINDER_SETTINGS.weekdays],
    hour: Number.isInteger(parsed.hour) && (parsed.hour as number) >= 0 && (parsed.hour as number) <= 23
      ? parsed.hour as number
      : DEFAULT_REMINDER_SETTINGS.hour,
    minute: Number.isInteger(parsed.minute) && (parsed.minute as number) >= 0 && (parsed.minute as number) <= 59
      ? parsed.minute as number
      : DEFAULT_REMINDER_SETTINGS.minute,
  };
}

export async function loadReminderSettings(
  read: () => Promise<string | null>,
): Promise<{ settings: ReminderSettings; storageFailed: boolean }> {
  try {
    return {
      settings: parseReminderSettings(await read()),
      storageFailed: false,
    };
  } catch {
    return {
      settings: parseReminderSettings(null),
      storageFailed: true,
    };
  }
}

export async function persistReminderSettings(
  settings: ReminderSettings,
  write: (value: string) => Promise<void>,
): Promise<boolean> {
  try {
    await write(JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

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