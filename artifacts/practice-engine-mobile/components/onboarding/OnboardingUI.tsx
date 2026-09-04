import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Button, Field } from '@/components/UI';

export function MultiSelect({ options, selected, onChange }: { options: string[], selected: string[], onChange: (s: string[]) => void }) {
  const c = useColors();
  const toggle = (opt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(opt)) onChange(selected.filter(o => o !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <View style={styles.wrapList}>
      {options.map(opt => {
        const isSel = selected.includes(opt);
        return (
          <Pressable key={opt} onPress={() => toggle(opt)} style={[styles.pill, { backgroundColor: isSel ? c.primary : c.card, borderColor: isSel ? c.primary : c.border }]}>
            <Text style={{ color: isSel ? c.primaryForeground : c.foreground, fontSize: 14, fontFamily: 'Inter_500Medium' }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SingleSelect({ options, selected, onChange, fullWidth }: { options: string[], selected?: string, onChange: (s: string) => void, fullWidth?: boolean }) {
  const c = useColors();
  return (
    <View style={fullWidth ? { gap: 10 } : styles.wrapList}>
      {options.map(opt => {
        const isSel = selected === opt;
        return (
          <Pressable key={opt} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt); }} style={[fullWidth ? styles.fullPill : styles.pill, { backgroundColor: isSel ? c.primary : c.card, borderColor: isSel ? c.primary : c.border }]}>
            <Text style={{ color: isSel ? c.primaryForeground : c.foreground, fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RatingScale({ label, value, onChange }: { label: string, value?: number, onChange: (v: number) => void }) {
  const c = useColors();
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_500Medium' }}>{label}</Text>
      <View style={styles.ratingRow}>
        {[1,2,3,4,5].map(n => {
          const isSel = value === n;
          return (
            <Pressable key={n} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(n); }} style={[styles.ratingCircle, { backgroundColor: isSel ? c.primary : c.card, borderColor: isSel ? c.primary : c.border }]}>
              <Text style={{ color: isSel ? c.primaryForeground : c.foreground, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function QuestionStepper({ questions, initialAnswers, onComplete, isSaving, buttonLabel = "Continue" }: { questions: string[], initialAnswers?: string[], onComplete: (ans: string[]) => void, isSaving: boolean, buttonLabel?: string }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(initialAnswers && initialAnswers.length === questions.length ? initialAnswers : new Array(questions.length).fill(''));
  const c = useColors();

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete(answers);
    }
  };

  return (
    <View style={{ gap: 24 }}>
      <Text style={{ color: c.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' }}>QUESTION {index + 1} OF {questions.length}</Text>
      <Text style={{ color: c.foreground, fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 28 }}>{questions[index]}</Text>
      <Field
        value={answers[index]}
        onChangeText={(val) => {
          const newAns = [...answers];
          newAns[index] = val;
          setAnswers(newAns);
        }}
        placeholder="Your answer..."
        multiline
      />
      <View style={{ gap: 12 }}>
        <Button
          label={index === questions.length - 1 ? buttonLabel : "Next Question"}
          onPress={handleNext}
          disabled={!answers[index].trim() || isSaving}
        />
        {index > 0 && (
          <Button label="Previous Question" onPress={() => setIndex(index - 1)} secondary disabled={isSaving} />
        )}
      </View>
    </View>
  );
}

export function AILoadingState({ message }: { message: string }) {
  const c = useColors();
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <ActivityIndicator size="large" color={c.primary} />
      <Text style={{ color: c.foreground, fontSize: 16, fontFamily: 'Inter_500Medium', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1 },
  fullPill: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1 },
  ratingRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  ratingCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});
