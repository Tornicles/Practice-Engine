import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "../../components/theme";
import { Body, Button, Card, Chip, EmptyState, Muted, ProgressBar, Row, Screen, SectionTitle, Title } from "../../components/ui";
import ExerciseAnimation from "../../components/ExerciseAnimation";
import { BENCHMARKS } from "../../lib/benchmarks";
import { CHALLENGES, MUSCLE_PROGRAMS, challengeById, exerciseById } from "../../lib/exercises";
import { fmtDate, fmtDuration } from "../../lib/format";
import { useForge } from "../../lib/store";
import type { ChallengeProgress, MuscleProgram, WorkoutBlock } from "../../lib/types";

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

function ProgramDetail({ program, onClose }: { program: MuscleProgram; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <Title>{program.name}</Title>
          <Muted style={{ marginTop: 4 }}>{program.tagline}</Muted>
          <Row gap={8} style={{ marginTop: 10, marginBottom: 12 }}>
            <Chip label={program.difficulty} />
            <Chip label={`~${program.minutes} min`} />
            <Chip label={`${program.blocks.length} exercises`} />
          </Row>
          {program.blocks.map((b, i) => {
            const ex = exerciseById.get(b.exerciseId);
            if (!ex) return null;
            const dose = b.reps ? `${b.sets} × ${b.reps} reps` : `${b.sets} × ${b.seconds}s`;
            return (
              <Row key={i} gap={12} style={styles.detailRow}>
                <View style={styles.thumb}>
                  <ExerciseAnimation archetype={ex.anim} size={56} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "700" }}>
                    {i + 1}. {ex.name}
                  </Body>
                  <Muted>{dose}</Muted>
                </View>
              </Row>
            );
          })}
          <Button
            title="Start workout"
            onPress={() => {
              onClose();
              router.push(`/session?programId=${program.id}` as never);
            }}
            style={{ marginTop: 16 }}
          />
          <Muted style={{ marginTop: 8, textAlign: "center" }}>
            Warm-up and cool-down are added automatically.
          </Muted>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ChallengeCard({ progress }: { progress: ChallengeProgress }) {
  const store = useForge.getState();
  const def = challengeById.get(progress.challengeId);
  if (!def) return null;

  if (progress.day > 30) {
    return (
      <Card>
        <Body style={{ fontWeight: "800" }}>{def.name} — complete! 🎉</Body>
        <Muted style={{ marginBottom: 10 }}>
          {progress.completedDays.length} workouts finished. Beast mode.
        </Muted>
        <Button title="Start again" variant="secondary" onPress={() => store.startChallenge(def.id)} />
      </Card>
    );
  }

  const today = def.buildDay(progress.day);
  return (
    <Card>
      <Body style={{ fontWeight: "800" }}>
        {def.name} — Day {progress.day} of 30
      </Body>
      <ProgressBar value={progress.completedDays.length} max={30} style={{ marginVertical: 10 }} />
      {today.rest ? (
        <>
          <Muted style={{ marginBottom: 10 }}>
            Rest day — recover, stretch, hydrate. Your muscles are rebuilding.
          </Muted>
          <Button
            title="Skip rest day"
            variant="secondary"
            onPress={() => store.skipChallengeDay(def.id)}
          />
        </>
      ) : (
        <>
          <Muted style={{ marginBottom: 10 }}>
            {today.focus} · {today.blocks.length} exercises · progressive overload
          </Muted>
          <Button
            title={`Continue — Day ${progress.day}`}
            onPress={() => router.push(`/session?challengeId=${def.id}&day=${progress.day}` as never)}
          />
        </>
      )}
      <Pressable onPress={() => store.quitChallenge()} style={{ marginTop: 10, alignSelf: "center" }}>
        <Text style={{ color: C.muted, fontSize: 13 }}>Quit challenge</Text>
      </Pressable>
    </Card>
  );
}

export default function Train() {
  const s = useForge();
  const [quick, setQuick] = useState(false);
  const [lowImpact, setLowImpact] = useState(false);
  const [bwOnly, setBwOnly] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<MuscleProgram | null>(null);

  const active = s.workoutPlans.find((p) => p.id === s.activePlanId && p.status === "active");
  const drafts = s.workoutPlans.filter((p) => p.status === "draft");
  const adaptQuery = `quick=${quick ? 1 : 0}&lowImpact=${lowImpact || s.profile.injuries.toLowerCase().includes("knee") ? 1 : 0}&bwOnly=${bwOnly ? 1 : 0}`;

  return (
    <Screen>
      <Title>Train</Title>
      <Muted style={{ marginBottom: 12 }}>Home workouts. AI suggests — you decide.</Muted>

      <SectionTitle>Train by muscle group</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
      >
        {MUSCLE_PROGRAMS.map((p) => (
          <Pressable key={p.id} onPress={() => setSelectedProgram(p)} style={styles.progCard}>
            <Body style={{ fontWeight: "800", fontSize: 16 }}>{p.name}</Body>
            <Muted numberOfLines={2} style={{ marginTop: 4 }}>
              {p.tagline}
            </Muted>
            <Row gap={6} style={{ marginTop: 10 }}>
              <Chip label={p.difficulty} />
              <Chip label={`${p.minutes} min`} />
            </Row>
          </Pressable>
        ))}
      </ScrollView>

      <SectionTitle>30-Day Challenge</SectionTitle>
      {s.challenge ? (
        <ChallengeCard progress={s.challenge} />
      ) : (
        CHALLENGES.map((c) => (
          <Card key={c.id}>
            <Body style={{ fontWeight: "800" }}>{c.name}</Body>
            <Muted style={{ marginBottom: 4 }}>{c.tagline}</Muted>
            <Muted style={{ marginBottom: 10 }}>30 days · progressive · rest every 4th day</Muted>
            <Button
              title="Start challenge"
              variant="secondary"
              onPress={() => useForge.getState().startChallenge(c.id)}
            />
          </Card>
        ))
      )}

      {selectedProgram && (
        <ProgramDetail program={selectedProgram} onClose={() => setSelectedProgram(null)} />
      )}

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

const styles = StyleSheet.create({
  progCard: {
    width: 190,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backText: { color: C.text, fontWeight: "700", fontSize: 16 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: C.surface2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
});
