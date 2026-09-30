import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { BarChart } from "../../components/charts";
import { C } from "../../components/theme";
import { Body, Button, Card, Chip, EmptyState, Muted, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { weeklyVolume } from "../../lib/engine";
import { fmtDate, fmtPace, kmDisplay } from "../../lib/format";
import { useForge } from "../../lib/store";
import { planRunProgression } from "../../lib/ai";
import { RUN_TYPE_LABELS } from "../../lib/types";
import { uid } from "../../lib/format";

export default function Run() {
  const s = useForge();
  const logRun = useForge((x) => x.logRun);
  const addRunPlan = useForge((x) => x.addRunPlan);
  const setActiveRunPlan = useForge((x) => x.setActiveRunPlan);

  const [dist, setDist] = useState("");
  const [mins, setMins] = useState("");
  const [effort, setEffort] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const active = s.runPlans.find((p) => p.id === s.activeRunPlanId && p.status === "active");
  const week = active ? active.weeks[Math.min(active.currentWeek - 1, active.weeks.length - 1)] ?? [] : [];
  const vol = weeklyVolume(s, 8);
  const units = s.settings.units;

  const totalKm = s.runSessions.reduce((n, r) => n + r.distanceKm, 0);
  const longest = s.runSessions.reduce((n, r) => Math.max(n, r.distanceKm), 0);

  const saveRun = () => {
    const d = parseFloat(dist);
    const m = parseFloat(mins);
    if (!d || !m) return;
    logRun({ date: new Date().toISOString(), distanceKm: d, durationMin: m, effort, notes: notes.trim() || undefined });
    setDist("");
    setMins("");
    setNotes("");
  };

  const newPlan = async (goal: "5k" | "10k" | "habit") => {
    setBusy(true);
    try {
      const r = await planRunProgression(goal, longest, 3);
      if (r.ok) {
        const plan = {
          id: uid("rp"),
          title: r.data.title,
          goal,
          weeks: r.data.weeks,
          currentWeek: 1,
          status: "active" as const,
          source: r.source,
          createdAt: new Date().toISOString(),
        };
        addRunPlan(plan);
        setActiveRunPlan(plan.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const advanceWeek = () => {
    if (!active) return;
    const next = Math.min(active.currentWeek + 1, active.weeks.length);
    useForge.setState((st) => ({
      runPlans: st.runPlans.map((p) => (p.id === active.id ? { ...p, currentWeek: next } : p)),
    }));
  };

  return (
    <Screen>
      <Title>Run</Title>
      <Muted style={{ marginBottom: 12 }}>One plan. Strength, runs, and fuel adapt together.</Muted>

      <Row gap={8} style={{ marginBottom: 12 }}>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Body style={{ fontWeight: "800", fontSize: 20 }}>{kmDisplay(totalKm, units)}</Body>
          <Muted>Total distance</Muted>
        </Card>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Body style={{ fontWeight: "800", fontSize: 20 }}>{kmDisplay(longest, units)}</Body>
          <Muted>Longest run</Muted>
        </Card>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Body style={{ fontWeight: "800", fontSize: 20 }}>{s.runSessions.length}</Body>
          <Muted>Runs logged</Muted>
        </Card>
      </Row>

      {active ? (
        <Card>
          <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <Body style={{ fontWeight: "800" }}>{active.title}</Body>
            <Chip label={active.source === "ai" ? "AI" : "Template"} />
          </Row>
          <Muted style={{ marginBottom: 10 }}>
            Week {active.currentWeek} of {active.weeks.length}
          </Muted>
          {week.map((w, i) => (
            <View key={i} style={styles.workout}>
              <Body style={{ fontWeight: "700" }}>{w.day} · {w.title}</Body>
              <Muted>
                {RUN_TYPE_LABELS[w.type]} · {w.detail}
              </Muted>
            </View>
          ))}
          <Row gap={8} style={{ marginTop: 12 }}>
            <Button title="Next week →" variant="secondary" onPress={advanceWeek} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <EmptyState title="No run plan" body="Pick a goal and Forge builds the progression." />
      )}

      <SectionTitle>Start a new plan</SectionTitle>
      <Row gap={8}>
        {(["5k", "10k", "habit"] as const).map((g) => (
          <Chip
            key={g}
            label={g === "5k" ? "Couch to 5K" : g === "10k" ? "Base to 10K" : "Run habit"}
            onPress={() => newPlan(g)}
          />
        ))}
      </Row>
      {busy && <Muted style={{ marginTop: 8 }}>Building your progression…</Muted>}

      <SectionTitle>Log a run</SectionTitle>
      <Card>
        <Row gap={10}>
          <View style={{ flex: 1 }}>
            <Muted>Distance ({units === "metric" ? "km" : "mi"})</Muted>
            <TextInput value={dist} onChangeText={setDist} keyboardType="numeric" placeholder="3.5" placeholderTextColor={C.muted} style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Muted>Minutes</Muted>
            <TextInput value={mins} onChangeText={setMins} keyboardType="numeric" placeholder="30" placeholderTextColor={C.muted} style={styles.input} />
          </View>
        </Row>
        <Muted style={{ marginTop: 10, marginBottom: 6 }}>Effort</Muted>
        <Row gap={6}>
          {([1, 2, 3, 4, 5] as const).map((e) => (
            <Chip key={e} label={String(e)} selected={effort === e} onPress={() => setEffort(e)} />
          ))}
          <Muted style={{ marginLeft: 4 }}>1 easy → 5 all-out</Muted>
        </Row>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          placeholderTextColor={C.muted}
          style={[styles.input, { marginTop: 10 }]}
        />
        <Button title="Log run" onPress={saveRun} style={{ marginTop: 12 }} />
      </Card>

      <SectionTitle>Weekly mileage</SectionTitle>
      <Card>
        <BarChart
          data={vol.map((w) => ({ label: w.label.slice(0, 5), value: Math.round(w.km * 10) / 10 }))}
          formatValue={(v) => (v > 0 ? `${v}` : "")}
          color={C.teal}
        />
      </Card>

      <SectionTitle>History</SectionTitle>
      {s.runSessions.slice(0, 8).map((r) => (
        <Card key={r.id} style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "700" }}>
                {kmDisplay(r.distanceKm, units)} · {r.durationMin} min
              </Body>
              <Muted>
                {fmtDate(r.date)} · pace {fmtPace(r.distanceKm, r.durationMin, units)}
                {r.planRef ? ` · ${r.planRef}` : ""}
                {r.notes ? `\n${r.notes}` : ""}
              </Muted>
            </View>
            <Text style={{ color: C.gold, fontWeight: "800" }}>{"★".repeat(r.effort ?? 3)}</Text>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 16,
    marginTop: 4,
  },
  workout: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
});
