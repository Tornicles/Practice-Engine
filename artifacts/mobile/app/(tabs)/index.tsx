import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../components/Avatar";
import { ReadinessRing } from "../../components/charts";
import { C } from "../../components/theme";
import { Body, Button, Card, Muted, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { effectiveStreak, readiness, todaysSchedule } from "../../lib/engine";
import { dayKey, fmtDay } from "../../lib/format";
import { useForge } from "../../lib/store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Today() {
  const s = useForge();
  const dismissNudge = useForge((x) => x.dismissNudge);

  const sched = todaysSchedule(s);
  const ready = readiness(s);
  const { streak, lives } = effectiveStreak(s);
  const nudges = s.nudges.filter((n) => !n.dismissed).slice(0, 4);
  const firstName = s.profile.name.split(" ")[0] || "Athlete";
  const mealsToday = s.mealPlans.find((m) => dayKey(m.date) === dayKey(new Date().toISOString()));

  return (
    <Screen>
      <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <View>
          <Muted>{fmtDay(new Date().toISOString())}</Muted>
          <Title>
            {greeting()}, {firstName}
          </Title>
        </View>
        <Avatar spec={s.profile.avatar} stage={s.avatar.stage} photoUri={s.avatarPhotoUri} size={56} />
      </Row>

      <Row gap={8} style={{ marginVertical: 10 }}>
        <View style={styles.pill}>
          <Ionicons name="flame" size={16} color={C.accent} />
          <Text style={styles.pillText}>{streak}-day streak</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="heart" size={16} color={C.red} />
          <Text style={styles.pillText}>{lives.left} {lives.left === 1 ? "life" : "lives"} left</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="star" size={16} color={C.gold} />
          <Text style={styles.pillText}>{s.avatar.xp} XP · {s.avatar.stage}</Text>
        </View>
      </Row>

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: "700", marginBottom: 4 }}>Readiness</Body>
            <Muted>
              {sched.restSuggested
                ? "Recovery mode — yesterday was hard."
                : sched.strengthDue || sched.runDue
                  ? "Green light. Train today."
                  : "No hard session scheduled — move easy or rest."}
            </Muted>
          </View>
          <ReadinessRing score={ready} size={96} />
        </Row>
      </Card>

      {nudges.length > 0 && (
        <>
          <SectionTitle>Nudges</SectionTitle>
          {nudges.map((n) => (
            <Card key={n.id} style={{ paddingVertical: 12 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Body style={{ flex: 1, marginRight: 8 }}>{n.text}</Body>
                <Pressable onPress={() => dismissNudge(n.id)} hitSlop={12}>
                  <Ionicons name="close" size={18} color={C.muted} />
                </Pressable>
              </Row>
              <Pressable onPress={() => router.push(`/(tabs)/${n.tab === "today" ? "" : n.tab}` as never)}>
                <Text style={{ color: C.accent, fontWeight: "700", marginTop: 8 }}>Open →</Text>
              </Pressable>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>Today's training</SectionTitle>
      {sched.strengthDue && sched.activePlan ? (
        <Card>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Body style={{ fontWeight: "800" }}>🏋️ {sched.activePlan.title}</Body>
          </Row>
          <Muted style={{ marginBottom: 12 }}>
            {sched.activePlan.blocks.length} exercises · ~{sched.activePlan.minutes} min
            {sched.activePlan.adaptedNote ? `\n${sched.activePlan.adaptedNote}` : ""}
          </Muted>
          <Button title="Start workout" onPress={() => router.push(`/session?planId=${sched.activePlan!.id}` as never)} />
        </Card>
      ) : null}
      {sched.runDue ? (
        <Card>
          <Body style={{ fontWeight: "800", marginBottom: 6 }}>🏃 {sched.runDue.title}</Body>
          <Muted style={{ marginBottom: 12 }}>{sched.runDue.detail}</Muted>
          <Button title="Log this run" variant="secondary" onPress={() => router.push("/(tabs)/run")} />
        </Card>
      ) : null}
      {!sched.strengthDue && !sched.runDue && (
        <Card>
          <Body style={{ fontWeight: "700", marginBottom: 4 }}>
            {sched.restSuggested ? "😴 Rest day" : "🌿 Easy day"}
          </Body>
          <Muted>
            {sched.restReason ?? "Walk, stretch, or cook something good. The streak forgives rest."}
          </Muted>
        </Card>
      )}

      <SectionTitle right={<Pressable onPress={() => router.push("/(tabs)/fuel")}><Text style={{ color: C.accent, fontWeight: "700" }}>Fuel →</Text></Pressable>}>
        Today's fuel
      </SectionTitle>
      {mealsToday ? (
        <Card>
          {mealsToday.meals.map((m, i) => (
            <View key={i} style={{ marginBottom: i < mealsToday.meals.length - 1 ? 10 : 0 }}>
              <Body style={{ fontWeight: "700" }}>{m.name}</Body>
              <Muted>{m.ingredients.join(" · ")}{m.calories ? ` · ${m.calories} kcal` : ""}</Muted>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <Muted>No meals planned yet today.</Muted>
          <Button title="Plan from my groceries" variant="secondary" onPress={() => router.push("/(tabs)/fuel")} style={{ marginTop: 10 }} />
        </Card>
      )}
    </Screen>
  );
}

const styles = {
  pill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  pillText: { color: C.text, fontSize: 12, fontWeight: "700" as const },
};
