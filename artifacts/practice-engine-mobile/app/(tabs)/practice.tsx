import React, { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListPracticeSessionsQueryKey,
  useCreatePracticeSession,
  useSimulateClientTurn,
} from '@workspace/api-client-react';
import type { ConversationMessage } from '@workspace/api-client-react';
import { Button, Card, ScreenTitle, State } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Feedback = { observation: string; skill: string; score: number; sessionComplete: boolean };

export default function Practice() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const simulate = useSimulateClientTurn();
  const save = useCreatePracticeSession({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPracticeSessionsQueryKey() }) },
  });
  const [scenario, setScenario] = useState('A client is avoiding a difficult decision');
  const [category, setCategory] = useState('Decision-making');
  const [difficulty, setDifficulty] = useState('Moderate');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saved, setSaved] = useState(false);

  const send = useCallback(() => {
    const coachMessage = text.trim();
    if (!coachMessage || simulate.isPending) return;
    // Capture the exact history for this request before adding its new turn.
    const history = messages;
    setSaved(false);
    setMessages((current) => [...current, { role: 'coach', content: coachMessage }]);
    setText('');
    setFeedback(null);
    simulate.mutate(
      { data: { scenario, category, difficulty, coachMessage, history } },
      {
        onSuccess: (result) => {
          setMessages((current) => [...current, { role: 'client', content: result.clientReply }]);
          setFeedback(result);
        },
      },
    );
  }, [category, difficulty, messages, scenario, simulate, text]);

  const complete = useCallback(() => {
    if (!feedback || save.isPending || saved) return;
    save.mutate({
      data: { scenario, category, score: feedback.score, feedback: feedback.observation },
    }, { onSuccess: () => setSaved(true) });
  }, [category, feedback, save, saved, scenario]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior="padding" keyboardVerticalOffset={0}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 87 : insets.top + 20 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={[styles.bubble, {
            backgroundColor: item.role === 'coach' ? c.accent : c.card,
            borderColor: c.border,
            alignSelf: item.role === 'coach' ? 'flex-end' : 'flex-start',
          }]}>
            <Text style={{ color: c.foreground }}>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={<>
          <ScreenTitle kicker="Deliberate practice" title="Client simulation" detail="Test your response against a client who can push back." />
          <Card>
            <TextInput value={scenario} onChangeText={setScenario} accessibilityLabel="Practice scenario" style={[styles.input, { color: c.foreground, borderColor: c.border }]} placeholderTextColor={c.mutedForeground} placeholder="Scenario" />
            <View style={styles.row}>{['Decision-making', 'Confidence', 'Boundaries'].map((item) => <Chip key={item} text={item} active={category === item} onPress={() => setCategory(item)} />)}</View>
            <View style={styles.row}>{['Foundational', 'Moderate', 'Stretch'].map((item) => <Chip key={item} text={item} active={difficulty === item} onPress={() => setDifficulty(item)} />)}</View>
          </Card>
          {simulate.error ? <State error={simulate.error} /> : null}
        </>}
        ListFooterComponent={feedback ? <Card>
          <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>OBSERVATION · {feedback.skill}</Text>
          <Text style={{ color: c.foreground }}>{feedback.observation}</Text>
          <Text style={{ color: c.accentForeground }}>Current score {feedback.score}/100</Text>
          {feedback.sessionComplete ? <Button testID="save-session" label={saved ? 'Session saved' : save.isPending ? 'Saving session' : 'Complete and save'} icon={saved ? 'check' : undefined} onPress={complete} disabled={save.isPending || saved} /> : null}
          {save.error ? <State error={save.error} /> : null}
        </Card> : null}
      />
      <View style={[styles.composer, { backgroundColor: c.background, borderColor: c.border, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          accessibilityLabel="Your coaching response"
          style={[styles.composerInput, { color: c.foreground }]}
          placeholder="Write your coaching response"
          placeholderTextColor={c.mutedForeground}
          multiline
          editable={!simulate.isPending}
        />
        <Pressable testID="send-simulation-turn" accessibilityRole="button" accessibilityLabel="Send coaching response" accessibilityState={{ disabled: !text.trim() || simulate.isPending }} onPress={send} disabled={!text.trim() || simulate.isPending} hitSlop={8}>
          <Text style={{ color: c.primary, fontFamily: 'Inter_700Bold', opacity: !text.trim() || simulate.isPending ? 0.45 : 1 }}>{simulate.isPending ? '…' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Chip({ text, active, onPress }: { text: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`${text}${active ? ', selected' : ''}`} onPress={onPress} hitSlop={4} style={[styles.chip, { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.accent : c.background }]}>
    <Text style={{ color: active ? c.accentForeground : c.mutedForeground, fontSize: 11 }}>{text}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 110, gap: 10 },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, fontFamily: 'Inter_400Regular', minHeight: 46 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 9, minHeight: 38, justifyContent: 'center' },
  bubble: { padding: 12, borderWidth: 1, borderRadius: 6, maxWidth: '86%' },
  composer: { borderTopWidth: 1, paddingHorizontal: 10, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  composerInput: { flex: 1, minHeight: 40, maxHeight: 90, fontFamily: 'Inter_400Regular', fontSize: 15 },
});
