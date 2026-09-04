import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { useGetPracticeOverview, useRecommendNextAction } from '@workspace/api-client-react';
import { Button, Card, ScreenTitle, State } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { refreshRecommendationFromReminder } from '@/lib/practice-reminders';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function Today() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const overview = useGetPracticeOverview();
  const recommendation = useRecommendNextAction();
  const [minutes, setMinutes] = useState(15);
  const { reminder } = useLocalSearchParams<{ reminder?: string }>();
  const handledReminder = useRef<string | undefined>(undefined);
  const recommendFrom = useCallback((data: NonNullable<typeof overview.data>) => {
    recommendation.mutate({ data: {
      currentObjective: data.profile.goal || data.profile.developmentFocus || 'Build stronger coaching practice',
      availableMinutes: minutes,
    } });
  }, [minutes, recommendation]);
  const recommend = () => { if (overview.data && !recommendation.isPending) recommendFrom(overview.data); };

  useEffect(() => {
    if (reminder && overview.data && handledReminder.current !== reminder) {
      handledReminder.current = reminder;
      void refreshRecommendationFromReminder(overview.refetch, recommendFrom);
    }
  }, [overview.data, overview.refetch, recommendFrom, reminder]);

  if (overview.isLoading) return <View style={[styles.page, { backgroundColor: c.background }]}><State loading /></View>;
  if (overview.error || !overview.data) return <View style={[styles.page, { backgroundColor: c.background }]}><State error={overview.error} retry={overview.refetch} /></View>;

  const data = overview.data;
  const onboardingData = data.profile.onboardingData;
  const practiceFocus = onboardingData?.goals?.primaryGoal || data.profile.goal || data.profile.developmentFocus || 'Improve your coaching technique';
  const buildAmbition = onboardingData?.build?.firstBuild?.title || 'your methodology';

  return <ScrollView
    style={[styles.page, { backgroundColor: c.background }]}
    contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 87 : insets.top + 20 }]}
    refreshControl={<RefreshControl refreshing={overview.isRefetching} onRefresh={overview.refetch} tintColor={c.primary} />}
  >
    <ScreenTitle kicker="Today’s practice" title={`Good work, ${data.profile.name}`} detail="Use one deliberate interval to make your experience compound." />

    <View style={styles.metrics}>
      <Metric n={data.profile.practiceScore} l="practice score" />
      <Metric n={data.profile.streak} l="day streak" />
      <Metric n={data.practiceSessionCount} l="sessions" />
    </View>

    <Card>
      <Text style={[styles.label, { color: c.primary }]}>NEXT DELIBERATE ACTION</Text>
      <View style={styles.choices}>{[5, 15, 30].map((value) => <Button key={value} label={`${value} min`} onPress={() => setMinutes(value)} secondary={minutes !== value} accessibilityLabel={`Use ${value} minutes${minutes === value ? ', selected' : ''}`} testID={`time-${value}`} />)}</View>
      {recommendation.data ? <>
        <Text style={[styles.action, { color: c.foreground }]}>{recommendation.data.action}</Text>
        <Text style={{ color: c.mutedForeground }}>{recommendation.data.reason}</Text>
        {recommendation.data.successCriteria.map((criterion) => <Text key={criterion} style={{ color: c.accentForeground }}>• {criterion}</Text>)}
      </> : <Button testID="recommend-action" label={recommendation.isPending ? 'Preparing your action' : 'Recommend next action'} onPress={recommend} disabled={recommendation.isPending} />}
      {recommendation.error ? <State error={recommendation.error} /> : null}
    </Card>

    <Text accessibilityRole="header" style={[styles.section, { color: c.foreground }]}>Daily Sequence</Text>

    <Link href="/(tabs)/practice" asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <Card style={styles.sequenceCard}>
          <View style={styles.sequenceRow}>
            <View style={[styles.iconBox, { backgroundColor: c.primary + '15' }]}>
              <Feather name="activity" size={18} color={c.primary} />
            </View>
            <View style={styles.sequenceText}>
              <Text style={[styles.sequenceTitle, { color: c.foreground }]}>1. Practice</Text>
              <Text style={[styles.sequenceDesc, { color: c.mutedForeground }]} numberOfLines={1}>Focus: {practiceFocus}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.mutedForeground} />
          </View>
        </Card>
      </TouchableOpacity>
    </Link>

    <Link href="/(tabs)/capture" asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <Card style={styles.sequenceCard}>
          <View style={styles.sequenceRow}>
            <View style={[styles.iconBox, { backgroundColor: c.primary + '15' }]}>
              <Feather name="book-open" size={18} color={c.primary} />
            </View>
            <View style={styles.sequenceText}>
              <Text style={[styles.sequenceTitle, { color: c.foreground }]}>2. Reflect</Text>
              <Text style={[styles.sequenceDesc, { color: c.mutedForeground }]}>Process a real coaching experience</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.mutedForeground} />
          </View>
        </Card>
      </TouchableOpacity>
    </Link>

    <Link href="/(tabs)/library" asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <Card style={styles.sequenceCard}>
          <View style={styles.sequenceRow}>
            <View style={[styles.iconBox, { backgroundColor: c.primary + '15' }]}>
              <Feather name="layers" size={18} color={c.primary} />
            </View>
            <View style={styles.sequenceText}>
              <Text style={[styles.sequenceTitle, { color: c.foreground }]}>3. Build</Text>
              <Text style={[styles.sequenceDesc, { color: c.mutedForeground }]} numberOfLines={1}>Develop {buildAmbition}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.mutedForeground} />
          </View>
        </Card>
      </TouchableOpacity>
    </Link>

  </ScrollView>;
}

function Metric({ n, l }: { n: number; l: string }) {
  const c = useColors();
  return <View style={[styles.metric, { borderColor: c.border }]}><Text style={[styles.num, { color: c.primary }]}>{n}</Text><Text style={[styles.metricLabel, { color: c.mutedForeground }]}>{l}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 120, gap: 12 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, borderWidth: 1, padding: 12 },
  num: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  label: { fontSize: 10, letterSpacing: 1.2, fontFamily: 'Inter_600SemiBold' },
  choices: { flexDirection: 'row', gap: 8 },
  action: { fontSize: 17, fontFamily: 'Inter_600SemiBold', lineHeight: 23 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 10 },
  sequenceCard: { padding: 12 },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sequenceText: { flex: 1, gap: 2 },
  sequenceTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  sequenceDesc: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});