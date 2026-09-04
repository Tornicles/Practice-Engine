import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import {
  type ReminderSettings,
  requestReminderPermissionAfterEnable,
  syncReminderSchedule,
} from './practice-reminders';

const STORAGE_KEY = 'practice-reminder-settings-v1';

export const WEEKDAYS = [
  { label: 'Sun', value: 1 },
  { label: 'Mon', value: 2 },
  { label: 'Tue', value: 3 },
  { label: 'Wed', value: 4 },
  { label: 'Thu', value: 5 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 7 },
] as const;

type PermissionState = 'unknown' | 'granted' | 'denied';

type ReminderContextValue = {
  settings: ReminderSettings;
  permission: PermissionState;
  canAskAgain: boolean;
  isReady: boolean;
  isSaving: boolean;
  setWeekday: (weekday: number) => Promise<void>;
  setTime: (hour: number, minute: number) => Promise<void>;
  enable: () => Promise<boolean>;
  togglePaused: () => Promise<void>;
  disable: () => Promise<void>;
  openSettings: () => Promise<void>;
};

const defaults: ReminderSettings = {
  enabled: false,
  paused: false,
  weekdays: [2, 3, 4, 5, 6],
  hour: 9,
  minute: 0,
};

const ReminderContext = createContext<ReminderContextValue | null>(null);

async function schedule(settings: ReminderSettings) {
  if (Platform.OS === 'web') return;
  await syncReminderSchedule(
    settings,
    Notifications,
    Notifications.SchedulableTriggerInputTypes.WEEKLY,
  );
}

export function PracticeReminderProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReminderSettings>(defaults);
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReminderSettings>;
        setSettings({ ...defaults, ...parsed });
      }
      if (Platform.OS !== 'web') {
        const current = await Notifications.getPermissionsAsync();
        setPermission(current.granted ? 'granted' : current.status === 'denied' ? 'denied' : 'unknown');
        setCanAskAgain(current.canAskAgain);
      }
      setIsReady(true);
    };
    void load();
  }, []);

  const save = async (next: ReminderSettings) => {
    setIsSaving(true);
    try {
      setSettings(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      await schedule(next);
    } finally {
      setIsSaving(false);
    }
  };

  const enable = async () => {
    if (Platform.OS === 'web') return false;
    setIsSaving(true);
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('practice-reminders', {
          name: 'Practice reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const current = await requestReminderPermissionAfterEnable(
        Notifications.getPermissionsAsync,
        Notifications.requestPermissionsAsync,
      );
      setPermission(current.granted ? 'granted' : 'denied');
      setCanAskAgain(current.canAskAgain);
      if (!current.granted) return false;
      const next = { ...settings, enabled: true, paused: false };
      setSettings(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      await schedule(next);
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const setWeekday = async (weekday: number) => {
    const exists = settings.weekdays.includes(weekday);
    if (exists && settings.weekdays.length === 1) return;
    await save({
      ...settings,
      weekdays: exists ? settings.weekdays.filter((day) => day !== weekday) : [...settings.weekdays, weekday].sort(),
    });
  };

  const value = useMemo<ReminderContextValue>(() => ({
    settings,
    permission,
    canAskAgain,
    isReady,
    isSaving,
    setWeekday,
    setTime: async (hour, minute) => save({ ...settings, hour, minute }),
    enable,
    togglePaused: async () => save({ ...settings, paused: !settings.paused }),
    disable: async () => save({ ...settings, enabled: false, paused: false }),
    openSettings: async () => { await Linking.openSettings(); },
  }), [settings, permission, canAskAgain, isReady, isSaving]);

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function usePracticeReminder() {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('usePracticeReminder must be used within PracticeReminderProvider');
  return context;
}