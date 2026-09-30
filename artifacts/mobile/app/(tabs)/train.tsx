import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { C } from "../../components/theme";
import { Body, Button, Card, Chip, EmptyState, Muted, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { BENCHMARKS } from "../../lib/benchmarks";
import { exerciseById } from "../../lib/exercises";
import { fmtDate, fmtDuration } from "../../lib/format";
import { useForge } from "../../lib/store";
import type { WorkoutBlock } from "../../lib/types";

function BlockPreview({ block, index }: { block: WorkoutBlock; index: number }) {
  const [open, setOpen] = useState(false);
  const ex = exerciseById.get(block.exerciseId);
  if (!ex) return null;
  const dose = block.reps ? `${block.sets} × ${block.reps} reps` : `${block.sets} × ${block.seconds}s`;
  return (
    <Pressable onPress={() => setOpen(!open)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Row style={{ justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: "700" }}>
            {index + 1}. {ex.name}
          </Body>
          <Muted>
            {dose} · {ex.muscles.join("/")}
            {ex.impact === "high" ? " · high-impact" : ""}
          </Muted>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={C.muted} />
      </Row>
      {open && (
        <View style={{ marginTop: 8, backgroundColor: C.surface2, borderRadius: 10, padding: 10 }}>
          {ex.cues.map((c, i) => (
            <Text key={i} style={{ color: C.text, fontSize: 13, marginBottom: 4 }}>• {c}</Text>
          ))}
          <Muted style={{ marginTop: 4 }}>
            {ex.regressTo ? `Easier: ${exerciseById.get(ex.regressTo)?.name ?? ex.regressTo}` : ""}
            {ex.regressTo && ex.progressTo ? " · " : ""}
            {ex.progressTo ? `Harder: ${exerciseById.get(ex.progressTo)?.name ?? ex.progressTo}` : ""}
          </Muted>
        </View>
      )}
    </Pressable>
  );
}

export default function Train() {
  const s = useForge();
  const [quick, setQuick] = useState(false);
  const [lowImpact, setLowImpact] = useState(false);
  const [bwOnly, setBwOnly] = useState(false);

  const active = s.workoutPlans.find((p) => p.id === s.activePlanId && p.status === "active");
  const drafts = s.workoutPlans.filter((p) => p.status === "draft");
  const adaptQuery = `quick=${quick ? 1 : 0}&lowImpact=${lowImpact || s.profile.injuries.toLowerCase().includes("knee") ? 1 : 0}&bwOnly=${bwOnly ? 1 : 0}`;

  return (
    <Screen>
      <Title>Train</Title>
      <Muted style={{ marginBottom: 12 }}>Home workouts. AI suggests — you decide.</Muted>

      {active ? (
        <Card>
          <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <Body style={{ fontWeight: "800", flex: 1 }}>{active.title}</Body>
            <Chip label={active.source === "ai" ? "AI" : "Template"} />
          </Row>
          <Muted style={{ marginBottom: 12 }}>
            {active.blocks.length} exercises · ~{active.minutes} min · {active.level}
          </Muted>

          <Body style={{ fontWeight: "700", marginBottom: 8 }}>Adapt this session</Body>
          <Row gap={8} style={{ flexWrap: "wrap", marginBottom: 12 }}>
            <Chip label="⚡ 15-min version" selected={quick} onPress={() => setQuick(!quick)} />
            <Chip label="🦵 Low-impact" selected={lowImpact} onPress={() => setLowImpact(!lowImpact)} />
            <Chip label="🏠 Bodyweight only" selected={bwOnly} onPress={() => setBwOnly(!bwOnly)} />
          </Row>

          <Button
            title="Start workout"
            onPress={() => router.push(`/session?planId=${active.id}&${adaptQuery}` as never)}
          />

          <View style={{ marginTop: 14 }}>
            <Muted style={{ marginBottom: 4, fontWeight: "700" }}>Preview — no surprises</Muted>
            {active.blocks.map((b, i) => (
              <BlockPreview key={i} block={b} index={i} />
            ))}
          </View>
        </Card>
      ) : (
        <EmptyState title="No active plan" body="Generate one and approve it to start training." />
      )}

      {drafts.length > 0 && (
        <>
          <SectionTitle>Drafts awaiting review</SectionTitle>
          {drafts.map((d) => (
            <Card key={d.id}>
              <Body style={{ fontWeight: "700" }}>{d.title}</Body>
              <Muted style={{ marginBottom: 10 }}>
                {d.blocks.length} exercises · ~{d.minutes} min · {d.source}
              </Muted>
              <Row gap={8}>
                <Button title="Make active" variant="secondary" onPress={() => useForge.getState().setActivePlan(d.id)} style={{ flex: 1 }} />
              </Row>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>Benchmarks — beat yourself</SectionTitle>
      <Muted style={{ marginBottom: 8 }}>Named all-out efforts. Your best time is the one to beat.</Muted>
      {BENCHMARKS.map((b) => {
        const pb = s.pbs[b.id]?.[0];
        return (
          <Card key={b.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "800" }}>{b.name}</Body>
                <Muted>{b.tagline}</Muted>
                <Muted style={{ marginTop: 4 }}>
                  {pb ? `🏆 PB: ${fmtDuration(pb.seconds)} · ${fmtDate(pb.date)}` : "No attempt yet — set the bar."}
                </Muted>
              </View>
            </Row>
            <Button
              title="Start benchmark"
              variant="secondary"
              onPress={() => router.push(`/session?benchmarkId=${b.id}` as never)}
              style={{ marginTop: 10 }}
            />
          </Card>
        );
      })}

      <SectionTitle>Recent sessions</SectionTitle>
      {s.workoutSessions.slice(0, 5).map((ws) => (
        <Card key={ws.id} style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "700" }}>{ws.title}</Body>
              <Muted>
                {fmtDate(ws.date)} · {ws.minutes} min · {ws.blocksDone}/{ws.blocksTotal} blocks
                {ws.difficulty ? ` · ${ws.difficulty.replace("_", " ")}` : ""}
              </Muted>
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
