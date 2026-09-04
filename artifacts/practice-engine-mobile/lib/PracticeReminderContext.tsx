import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  persistReminderSettings,
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
  storageError: string | null;
  retryStorage: () => Promise<void>;
  setWeekday: (weekday: number) => Promise<void>;
  setTime: (hour: number, minute: number) => Promise<void>;
  enable: () => Promise<boolean>;
  togglePaused: () => Promise<void>;
  disable: () => Promise<void>;
  openSettings: () => Promise<void>;
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
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [pendingSettings, setPendingSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await loadReminderSettings(() => AsyncStorage.getItem(STORAGE_KEY));
        setSettings(loaded.settings);
        if (loaded.storageFailed) {
          setStorageError('Device storage is temporarily unavailable. Using default reminder settings.');
        }
        if (Platform.OS !== 'web') {
          const current = await Notifications.getPermissionsAsync();
          setPermission(current.granted ? 'granted' : current.status === 'denied' ? 'denied' : 'unknown');
          setCanAskAgain(current.canAskAgain);
        }
      } finally {
        setIsReady(true);
      }
    };
    void load();
  }, []);

  const save = async (next: ReminderSettings) => {
    setIsSaving(true);
    try {
      const persisted = await persistReminderSettings(
        next,
        (value) => AsyncStorage.setItem(STORAGE_KEY, value),
      );
      if (!persisted) {
        setPendingSettings(next);
        setStorageError('Could not save reminder changes. Check device storage and try again.');
        return false;
      }
      setSettings(next);
      setPendingSettings(null);
      setStorageError(null);
      await schedule(next);
      return true;
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
      return await save(next);
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
    storageError,
    retryStorage: async () => {
      if (pendingSettings) {
        await save(pendingSettings);
        return;
      }
      setIsSaving(true);
      try {
        const loaded = await loadReminderSettings(() => AsyncStorage.getItem(STORAGE_KEY));
        setSettings(loaded.settings);
        setStorageError(loaded.storageFailed
          ? 'Device storage is still unavailable. Check your device and try again.'
          : null);
      } finally {
        setIsSaving(false);
      }
    },
    setWeekday,
    setTime: async (hour, minute) => { await save({ ...settings, hour, minute }); },
    enable,
    togglePaused: async () => { await save({ ...settings, paused: !settings.paused }); },
    disable: async () => { await save({ ...settings, enabled: false, paused: false }); },
    openSettings: async () => { await Linking.openSettings(); },
  }), [settings, permission, canAskAgain, isReady, isSaving, storageError, pendingSettings]);

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function usePracticeReminder() {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('usePracticeReminder must be used within PracticeReminderProvider');
  return context;
}