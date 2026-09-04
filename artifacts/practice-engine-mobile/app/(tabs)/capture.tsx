import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useExtractExperienceKnowledge } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Card, Field, ScreenTitle } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { useOfflineCapture } from '@/lib/OfflineCaptureContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Capture() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { draft, loaded, syncState, queuedCount, isEnqueueing, storageError, updateDraft, queueDraft, retry } = useOfflineCapture();
  const extract = useExtractExperienceKnowledge({
    mutation: {
      onSuccess: (result) => updateDraft({
        title: result.title,
        lesson: result.lesson,
        principle: result.principle,
      }),
    },
  });
  const fieldsEditable = loaded && !isEnqueueing;
  const status = syncState === 'synced'
    ? { icon: 'check-circle' as const, text: 'Synced to your private library.', color: c.primary }
    : syncState === 'failed'
      ? { icon: 'alert-circle' as const, text: storageError ? 'Secure device storage was unavailable. Your draft is still here.' : `${queuedCount} note${queuedCount === 1 ? '' : 's'} could not sync. Your copy is safe.`, color: c.destructive }
      : queuedCount > 0
        ? { icon: 'clock' as const, text: `${queuedCount} note${queuedCount === 1 ? '' : 's'} waiting to sync.`, color: c.accentForeground }
        : null;

  return <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 87 : insets.top + 20 }]} bottomOffset={36}>
    <ScreenTitle kicker="Capture" title="Make today teach you" detail="Your draft is saved privately on this device while you type." />
    {status ? <View style={[styles.status, { borderColor: c.border, backgroundColor: c.card }]}>
      <Feather name={status.icon} size={17} color={status.color} />
      <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
      {syncState === 'failed' ? <Button testID="retry-sync" label="Retry" secondary onPress={() => void retry()} /> : null}
    </View> : null}
    <Card>
      <Field label="Situation" value={draft.situation} onChangeText={(situation) => updateDraft({ situation })} placeholder="What happened with your client?" multiline editable={fieldsEditable} />
      <Field label="Your reflection" value={draft.reflection} onChangeText={(reflection) => updateDraft({ reflection })} placeholder="What did you notice, try, or learn?" multiline editable={fieldsEditable} />
      <Button testID="extract-knowledge" label={extract.isPending ? 'Extracting insight' : 'Extract knowledge'} onPress={() => extract.mutate({ data: { title: draft.title, situation: draft.situation, coachReflection: draft.reflection } })} disabled={!loaded || !draft.situation || extract.isPending} />
    </Card>
    {(draft.lesson || draft.principle) ? <Card>
      <Field label="Title" value={draft.title} onChangeText={(title) => updateDraft({ title })} placeholder="A concise title" editable={fieldsEditable} />
      <Field label="Lesson" value={draft.lesson} onChangeText={(lesson) => updateDraft({ lesson })} placeholder="What the experience taught you" multiline editable={fieldsEditable} />
      <Field label="Principle" value={draft.principle} onChangeText={(principle) => updateDraft({ principle })} placeholder="A reusable practice principle" multiline editable={fieldsEditable} />
      <Button testID="save-experience" label={isEnqueueing ? 'Saving safely' : 'Save to library'} onPress={() => void queueDraft()} disabled={!loaded || isEnqueueing || !draft.title || !draft.lesson || !draft.principle} />
    </Card> : null}
    {extract.error ? <Text accessibilityRole="alert" style={{ color: c.destructive }}>Knowledge extraction failed. Please try again.</Text> : null}
  </KeyboardAwareScrollViewCompat>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 18, paddingBottom: 120, gap: 14 },
  status: { borderWidth: 1, borderRadius: 6, padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },
});