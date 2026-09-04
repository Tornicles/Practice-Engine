import React, { useState } from 'react';
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useClerk } from '@clerk/expo';
import { useGenerateKnowledgeAsset, useListExperiences, useListKnowledgeAssets } from '@workspace/api-client-react';
import { Button, Card, ScreenTitle, State } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { useOfflineCapture } from '@/lib/OfflineCaptureContext';
import { usePracticeReminder, WEEKDAYS } from '@/lib/PracticeReminderContext';

function ReminderSettings() {
  const c = useColors();
  const {
    settings, permission, canAskAgain, isReady, isSaving,
    setWeekday, setTime, enable, togglePaused, disable, openSettings,
  } = usePracticeReminder();

  if (!isReady) return null;

  const changeTime = (amount: number) => {
    const total = (settings.hour * 60 + settings.minute + amount + 1440) % 1440;
    void setTime(Math.floor(total / 60), total % 60);
  };
  const time = new Date(2000, 0, 1, settings.hour, settings.minute).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const turnOn = async () => {
    const allowed = await enable();
    if (!allowed && Platform.OS !== 'web') {
      Alert.alert('Notifications are off', 'Allow notifications in system settings to receive practice reminders.');
    }
  };

  return (
    <Card>
      <Text style={[styles.item, { color: c.foreground }]}>Practice reminders</Text>
      <Text style={{ color: c.mutedForeground }}>
        {settings.enabled
          ? settings.paused ? 'Paused' : `Active at ${time}`
          : 'Choose a routine that fits your week. Notifications stay off until you enable them.'}
      </Text>
      <View style={styles.days}>
        {WEEKDAYS.map((day) => {
          const selected = settings.weekdays.includes(day.value);
          return (
            <Pressable
              key={day.value}
              testID={`reminder-day-${day.value}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${day.label} reminder`}
              onPress={() => void setWeekday(day.value)}
              disabled={isSaving}
              style={[styles.day, {
                borderColor: c.border,
                backgroundColor: selected ? c.primary : c.secondary,
                opacity: isSaving ? 0.5 : 1,
              }]}
            >
              <Text style={{ color: selected ? c.primaryForeground : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                {day.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.timeRow}>
        <Button testID="reminder-time-earlier" label="− 15 min" secondary onPress={() => changeTime(-15)} disabled={isSaving} />
        <Text style={[styles.time, { color: c.foreground }]}>{time}</Text>
        <Button testID="reminder-time-later" label="+ 15 min" secondary onPress={() => changeTime(15)} disabled={isSaving} />
      </View>
      {!settings.enabled ? (
        <Button testID="enable-reminders" label={isSaving ? 'Enabling' : 'Enable reminders'} icon="bell" onPress={() => void turnOn()} disabled={isSaving || Platform.OS === 'web'} />
      ) : (
        <>
          <Button testID="pause-reminders" label={settings.paused ? 'Resume reminders' : 'Pause reminders'} secondary icon={settings.paused ? 'play' : 'pause'} onPress={() => void togglePaused()} disabled={isSaving} />
          <Button testID="disable-reminders" label="Disable reminders" secondary icon="bell-off" onPress={() => void disable()} disabled={isSaving} />
        </>
      )}
      {permission === 'denied' && !canAskAgain && Platform.OS !== 'web' ? (
        <Button testID="open-notification-settings" label="Open system settings" secondary icon="settings" onPress={() => void openSettings()} />
      ) : null}
      {Platform.OS === 'web' ? <Text style={{ color: c.mutedForeground }}>Set reminders from the iOS or Android app.</Text> : null}
    </Card>
  );
}

export default function Library() {
  const c = useColors();
  const [filter, setFilter] = useState<'experiences' | 'assets'>('experiences');
  const experiences = useListExperiences();
  const assets = useListKnowledgeAssets();
  const generate = useGenerateKnowledgeAsset({ mutation: { onSuccess: () => assets.refetch() } });
  const { signOut } = useClerk();
  const { clearAccountData } = useOfflineCapture();
  const active = filter === 'experiences' ? experiences : assets;
  const handleSignOut = async () => {
    await clearAccountData();
    await signOut();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={active.refetch} tintColor={c.primary} />}>
      <ScreenTitle kicker="Library" title="Your evidence base" detail="Experiences, principles, and assets that remain traceable to real work." />
      <View style={styles.tabs}>
        <Button testID="filter-experiences" label="Experiences" onPress={() => setFilter('experiences')} secondary={filter !== 'experiences'} />
        <Button testID="filter-assets" label="Assets" onPress={() => setFilter('assets')} secondary={filter !== 'assets'} />
      </View>
      {active.isLoading ? <State loading /> : active.error ? <State error={active.error} retry={active.refetch} /> : filter === 'experiences' ? (
        experiences.data?.length ? experiences.data.map((experience) => (
          <Card key={experience.id}>
            <Text style={[styles.item, { color: c.foreground }]}>{experience.title}</Text>
            <Text style={{ color: c.mutedForeground }}>{experience.learning}</Text>
            <Text style={{ color: c.accentForeground }}>{experience.principle}</Text>
            <Button testID={`generate-${experience.id}`} label={generate.isPending ? 'Generating' : 'Generate framework'} secondary onPress={() => generate.mutate({ data: { sourceExperienceId: experience.id, assetType: 'framework', objective: 'Create a reusable coaching framework' } })} disabled={generate.isPending} />
          </Card>
        )) : <State empty="Capture a client experience to begin your library." />
      ) : (
        assets.data?.length ? assets.data.map((asset) => (
          <Card key={asset.id}>
            <Text style={[styles.item, { color: c.foreground }]}>{asset.title}</Text>
            <Text style={{ color: c.primary }}>{asset.type.toUpperCase()}</Text>
            <Text numberOfLines={3} style={{ color: c.mutedForeground }}>{asset.content}</Text>
          </Card>
        )) : <State empty="Generate an asset from an experience when you are ready." />
      )}
      <ReminderSettings />
      <Card>
        <Text style={[styles.item, { color: c.foreground }]}>Profile & account</Text>
        <Text style={{ color: c.mutedForeground }}>Manage your practice profile from your web workspace.</Text>
        <Button testID="sign-out" label="Sign out" secondary onPress={() => void handleSignOut()} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 120, gap: 12 },
  tabs: { flexDirection: 'row', gap: 8 },
  item: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { width: 38, height: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  time: { fontFamily: 'Inter_700Bold', fontSize: 17, minWidth: 70, textAlign: 'center' },
});