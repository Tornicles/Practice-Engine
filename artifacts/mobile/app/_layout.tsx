import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { scheduleDailyReminder } from "../lib/notifications";
import { useForge } from "../lib/store";
import { C } from "../components/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ children }: { children: React.ReactNode }) {
  const onboarded = useForge((s) => s.onboarded);
  const segments = useSegments();

  useEffect(() => {
    const seg = segments[0];
    if (!onboarded && seg !== "onboarding") router.replace("/onboarding");
    else if (onboarded && seg === "onboarding") router.replace("/(tabs)");
  }, [onboarded, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const hydrated = useForge((s) => s.hydrated);
  const refreshDay = useForge((s) => s.refreshDay);
  const settings = useForge((s) => s.settings);

  useEffect(() => {
    refreshDay();
    SplashScreen.hideAsync().catch(() => {});
    if (settings.reminders) {
      scheduleDailyReminder(settings.reminderHour, settings.reminderMinute).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  return (
    <Gate>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="session"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
        />
      </Stack>
    </Gate>
  );
}
