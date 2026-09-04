import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export type NotificationsModule = typeof import('expo-notifications');

export const notificationsUnavailableInExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cachedNotifications: NotificationsModule | null | undefined;

export function getNotifications(): NotificationsModule | null {
  if (Platform.OS === 'web' || notificationsUnavailableInExpoGo) return null;
  if (cachedNotifications !== undefined) return cachedNotifications;

  try {
    cachedNotifications = require('expo-notifications') as NotificationsModule;
  } catch {
    cachedNotifications = null;
  }

  return cachedNotifications;
}