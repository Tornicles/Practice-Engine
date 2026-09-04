import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useGetPracticeProfile, useUpdatePracticeProfile } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Field, ScreenTitle, State } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const steps = [
  { title: 'Your practice', fields: [['name', 'Name', 'What should we call you?']] },
  { title: 'Your craft', fields: [['niche', 'Coaching niche', 'What kind of coaching do you do?'], ['experienceLevel', 'Experience level', 'How would you describe your experience?']] },
  { title: 'Your clients', fields: [['audience', 'Audience', 'Who do you serve?'], ['goal', 'Primary goal', 'What outcome matters most now?']] },
  { title: 'Your direction', fields: [['developmentFocus', 'Development focus', 'What capability are you deliberately building?'], ['workingPreferences', 'Working preferences', 'How do you prefer to practice?']] },
] as const;

export default function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const profile = useGetPracticeProfile();
  const update = useUpdatePracticeProfile();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  if (profile.isLoading) return <View style={{ flex: 1, backgroundColor: c.background }}><State loading /></View>;
  if (profile.error || !profile.data) return <View style={{ flex: 1, backgroundColor: c.background }}><State error={profile.error} retry={profile.refetch} /></View>;
  if (profile.data.onboardingCompleted) return <Redirect href="/(tabs)" />;

  const index = selectedStep ?? Math.max(0, profile.data.onboardingStep - 1);
  const step = steps[index];
  const fields = step.fields.map(([key, label, placeholder]) => ({ key, label, placeholder, value: draft[key] ?? profile.data[key] ?? '' }));
  const next = () => {
    if (update.isPending) return;
    update.mutate({
      data: {
        ...Object.fromEntries(fields.map((field) => [field.key, field.value.trim()])),
        onboardingStep: Math.min(4, index + 2),
        onboardingCompleted: index === steps.length - 1,
      },
    }, {
      onSuccess: () => {
        if (index < steps.length - 1) setSelectedStep(index + 1);
        void profile.refetch();
      },
    });
  };

  return <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={[styles.wrap, { paddingTop: Platform.OS === 'web' ? 87 : insets.top + 24 }]} bottomOffset={40}>
    <View style={styles.inner}>
      <Text style={[styles.progress, { color: c.primary }]}>SETUP {index + 1} / {steps.length}</Text>
      <View style={[styles.rule, { backgroundColor: c.border }]}><View style={[styles.fill, { backgroundColor: c.primary, width: `${(index + 1) * 25}%` }]} /></View>
      <ScreenTitle kicker="Startup Man · private practice profile" title={step.title} detail="This shapes the work Startup Man recommends." />
      {fields.map((field) => <Field key={field.key} label={field.label} value={field.value} onChangeText={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} placeholder={field.placeholder} />)}
      <Button testID="onboarding-next" label={update.isPending ? 'Saving your profile' : index === 3 ? 'Enter Startup Man' : 'Continue'} onPress={next} disabled={fields.some((field) => !field.value.trim()) || update.isPending} />
      {update.error ? <State error={update.error} /> : null}
    </View>
  </KeyboardAwareScrollViewCompat>;
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 },
  progress: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4 },
  rule: { height: 4, width: '100%' },
  fill: { height: 4 },
});