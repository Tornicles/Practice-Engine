import React from "react";
import { Text, View } from "react-native";
import { Avatar, AvatarFigure } from "../../components/Avatar";
import { BarChart } from "../../components/charts";
import { C, STAGE_COLORS } from "../../components/theme";
import { Body, Card, Muted, ProgressBar, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { activityCalendar, effectiveStreak, ratingDistribution, weeklyVolume, xpForNextStage } from "../../lib/engine";
import { fmtDate, fmtDuration } from "../../lib/format";
import { useForge } from "../../lib/store";
import { AVATAR_STAGES, DIFFICULTY_LABELS, type AvatarStage } from "../../lib/types";
import { benchmarkById } from "../../lib/benchmarks";
import { StyleSheet } from "react-native";

/** Multi-metric fitness snapshot (Freeletics Daily-Athlete-Score pattern, original). */
function forgeScore(s: ReturnType<typeof useForge.getState>): number {
  const now = Date.now();
  const inDays = (iso: string, d: number) => now - new Date(iso).getTime() < d * 86_400_000;
  const recentW = s.workoutSessions.filter((x) => inDays(x.date, 28)).length;
  const recentR = s.runSessions.filter((x) => inDays(x.date, 28)).length;
  const consistency = Math.min(40, (recentW + recentR) * 4);
  const ratings = s.workoutSessions.filter((x) => x.difficulty && inDays(x.date, 28));
  const justRight = ratings.filter((x) => x.difficulty === "just_right").length;
  const calibration = ratings.length ? Math.round((justRight / ratings.length) * 25) : 10;
  const km = s.runSessions.filter((x) => inDays(x.date, 28)).reduce((n, r) => n + r.distanceKm, 0);
  const endurance = Math.min(20, Math.round(km * 0.8));
  const xp = Math.min(15, Math.round(s.avatar.xp / 40));
  return Math.min(100, consistency + calibration + endurance + xp);
}

const STAGE_ORDER: AvatarStage[] = ["spark", "ember", "forge", "titan"];

export default function Progress() {
  const s = useForge();
  const { streak, lives } = effectiveStreak(s);
  const vol = weeklyVolume(s, 8);
  const dist = ratingDistribution(s);
  const cal = activityCalendar(s);
  const nextXp = xpForNextStage(s.avatar.xp);
  const score = forgeScore(s);
  const totalRatings = dist.too_easy + dist.just_right + dist.too_hard;

  return (
    <Screen>
      <Title>Progress</Title>
      <Muted style={{ marginBottom: 12 }}>Your record is your identity.</Muted>

      <Card>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Body style={{ fontWeight: "800", fontSize: 34 }}>{score}</Body>
            <Muted>Forge Score · 28-day snapshot</Muted>
          </View>
          <View style={{ alignItems: "center" }}>
            <Body style={{ fontWeight: "800", fontSize: 20 }}>{streak}🔥</Body>
            <Muted>day streak · {lives.left} lives</Muted>
          </View>
        </Row>
      </Card>

      <SectionTitle>Your avatar evolves</SectionTitle>
      <Card>
        <Row style={{ justifyContent: "space-around", marginBottom: 12 }}>
          {STAGE_ORDER.map((st) => {
            const reached = STAGE_ORDER.indexOf(st) <= STAGE_ORDER.indexOf(s.avatar.stage);
            const pal = STAGE_COLORS[st];
            return (
              <View key={st} style={{ alignItems: "center", opacity: reached ? 1 : 0.35 }}>
                <AvatarFigure spec={s.profile.avatar} stage={st} size={64} />
                <Text style={{ color: reached ? pal.main : C.muted, fontSize: 11, fontWeight: "800", marginTop: 4 }}>
                  {AVATAR_STAGES.find((x) => x.id === st)?.label}
                </Text>
                <Text style={{ color: C.muted, fontSize: 10 }}>
                  {AVATAR_STAGES.find((x) => x.id === st)?.xp} XP
                </Text>
              </View>
            );
          })}
        </Row>
        <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <Body style={{ fontWeight: "700" }}>
            {s.avatar.stage.charAt(0).toUpperCase() + s.avatar.stage.slice(1)} · {s.avatar.xp} XP
          </Body>
          <Muted>{nextXp ? `${nextXp - s.avatar.xp} XP to next` : "Max stage 🏆"}</Muted>
        </Row>
        {nextXp && (
          <ProgressBar
            value={s.avatar.xp - (AVATAR_STAGES.find((x) => x.id === s.avatar.stage)?.xp ?? 0)}
            max={nextXp - (AVATAR_STAGES.find((x) => x.id === s.avatar.stage)?.xp ?? 0)}
            color={STAGE_COLORS[s.avatar.stage].main}
          />
        )}
        <View style={{ alignItems: "center", marginTop: 14 }}>
          <Avatar spec={s.profile.avatar} stage={s.avatar.stage} photoUri={s.avatarPhotoUri} size={140} />
        </View>
      </Card>

      <SectionTitle>Weekly volume</SectionTitle>
      <Card>
        <Muted style={{ marginBottom: 8 }}>Workouts per week · last 8 weeks</Muted>
        <BarChart data={vol.map((w) => ({ label: w.label.slice(0, 5), value: w.workouts }))} />
      </Card>

      <SectionTitle>Session ratings</SectionTitle>
      <Card>
        {totalRatings === 0 ? (
          <Muted>No rated sessions yet — ratings tune your plan.</Muted>
        ) : (
          (Object.keys(dist) as (keyof typeof dist)[]).map((k) => (
            <View key={k} style={{ marginBottom: 10 }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <Body>{DIFFICULTY_LABELS[k]}</Body>
                <Muted>{dist[k]}</Muted>
              </Row>
              <ProgressBar
                value={dist[k]}
                max={Math.max(1, totalRatings)}
                color={k === "just_right" ? C.green : k === "too_easy" ? C.gold : C.red}
              />
            </View>
          ))
        )}
      </Card>

      <SectionTitle>Benchmark PBs</SectionTitle>
      {Object.keys(s.pbs).length === 0 ? (
        <Card>
          <Muted>No benchmarks attempted. Run one from the Train tab to set your first PB.</Muted>
        </Card>
      ) : (
        Object.entries(s.pbs).map(([bid, list]) => {
          const def = benchmarkById.get(bid);
          const best = list[0];
          return (
            <Card key={bid}>
              <Body style={{ fontWeight: "800" }}>{def?.name ?? bid}</Body>
              <Muted>
                🏆 Best: {fmtDuration(best.seconds)} · {fmtDate(best.date)}
              </Muted>
              {list.slice(1, 4).map((p, i) => (
                <Muted key={i}>
                  {fmtDuration(p.seconds)} · {fmtDate(p.date)}
                </Muted>
              ))}
            </Card>
          );
        })
      )}

      <SectionTitle>Last 28 days</SectionTitle>
      <Card>
        <View style={styles.cal}>
          {cal.map((d) => (
            <View
              key={d.date}
              style={[styles.dot, { backgroundColor: d.active ? C.accent : C.surface2 }]}
            />
          ))}
        </View>
        <Muted style={{ marginTop: 8 }}>Every lit day is a session or run. Gaps spend a streak life.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cal: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dot: { width: 22, height: 22, borderRadius: 6 },
});
