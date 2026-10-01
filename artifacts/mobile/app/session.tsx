import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "../components/theme";
import { Body, Button, Card, Muted, ProgressBar, Row, Title } from "../components/ui";
import { BENCHMARKS, benchmarkById } from "../lib/benchmarks";
import { buildTemplateSession, exerciseById, filterExercises } from "../lib/exercises";
import { adaptationForRating } from "../lib/engine";
import { dayKey, fmtDuration } from "../lib/format";
import { useForge } from "../lib/store";
import type { DifficultyRating, WorkoutBlock } from "../lib/types";

type Phase = "work" | "rest" | "rating";

interface PlayerBlock extends WorkoutBlock {
  name: string;
  cues: string[];
}

function adaptBlocks(blocks: WorkoutBlock[], opts: { quick: boolean; lowImpact: boolean; bwOnly: boolean }): WorkoutBlock[] {
  let out = blocks.map((b) => ({ ...b }));
  if (opts.lowImpact) {
    out = out.map((b) => {
      let ex = exerciseById.get(b.exerciseId);
      let guard = 0;
      while (ex && ex.impact === "high" && ex.regressTo && guard++ < 5) {
        const r = exerciseById.get(ex.regressTo);
        if (!r) break;
        ex = r;
        b = { ...b, exerciseId: ex.id };
      }
      return b;
    });
  }
  if (opts.bwOnly) {
    out = out.filter((b) => {
      const ex = exerciseById.get(b.exerciseId);
      return ex && ex.equipment.every((e) => e === "bodyweight");
    });
  }
  if (opts.quick) {
    // ~15 min: keep first 4 blocks, trim sets to 2.
    out = out.slice(0, 4).map((b) => ({ ...b, sets: Math.min(b.sets, 2) }));
  }
  return out;
}

export default function Session() {
  const params = useLocalSearchParams<{
    planId?: string;
    benchmarkId?: string;
    quick?: string;
    lowImpact?: string;
    bwOnly?: string;
  }>();
  const s = useForge.getState();
  const logWorkout = useForge((x) => x.logWorkout);

  const setup = useMemo(() => {
    const benchmark = params.benchmarkId ? benchmarkById.get(params.benchmarkId) : undefined;
    if (benchmark) {
      return {
        title: benchmark.name,
        forTime: true,
        planId: undefined as string | undefined,
        benchmarkId: benchmark.id,
        blocks: benchmark.blocks.map((b) => {
          const ex = exerciseById.get(b.exerciseId);
          return { ...b, name: ex?.name ?? b.exerciseId, cues: ex?.cues ?? [] };
        }),
      };
    }
    const plan = s.workoutPlans.find((p) => p.id === params.planId);
    if (!plan) return null;
    const adapted = adaptBlocks(plan.blocks, {
      quick: params.quick === "1",
      lowImpact: params.lowImpact === "1",
      bwOnly: params.bwOnly === "1",
    });
    const finalBlocks =
      adapted.length >= 3
        ? adapted
        : buildTemplateSession({
            focus: "full",
            minutes: 15,
            equipment: { ...s.equipment, dumbbells: false, bands: false, chair: true, pullupBar: false, kettlebell: false, bodyweight: true },
            level: s.profile.fitnessLevel === "beginner" ? 1 : s.profile.fitnessLevel === "intermediate" ? 2 : 3,
            lowImpact: true,
          }).blocks;
    return {
      title: plan.title,
      forTime: false,
      planId: plan.id,
      benchmarkId: undefined as string | undefined,
      blocks: finalBlocks.map((b) => {
        const ex = exerciseById.get(b.exerciseId);
        return { ...b, name: ex?.name ?? b.exerciseId, cues: ex?.cues ?? [] };
      }),
    };
  }, [params]);

  const [bi, setBi] = useState(0);
  const [setIdx, setSetIdx] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [rating, setRating] = useState<DifficultyRating | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const startRef = useRef(Date.now());

  const block: PlayerBlock | undefined = setup?.blocks[bi];
  const isLastBlock = setup ? bi === setup.blocks.length - 1 : false;
  const isLastSet = block ? setIdx >= block.sets : false;

  // Per-block timer init
  useEffect(() => {
    if (phase === "work" && block?.seconds) setTimeLeft(block.seconds);
    else if (phase === "rest" && block) setTimeLeft(block.restSec || 30);
    else setTimeLeft(null);
  }, [phase, bi, setIdx]);

  // Tick
  useEffect(() => {
    if (timeLeft == null || phase === "rating") return;
    const id = setInterval(() => setTimeLeft((t) => (t != null && t > 0 ? t - 1 : t)), 1000);
    return () => clearInterval(id);
  }, [timeLeft == null, phase]);

  // Benchmark total clock
  useEffect(() => {
    if (!setup?.forTime || phase === "rating") return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [setup?.forTime, phase]);

  // Auto-advance timed work/rest
  useEffect(() => {
    if (timeLeft === 0) {
      if (phase === "work") completeSet();
      else if (phase === "rest") nextBlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  if (!setup || !block) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Body>Workout not found.</Body>
          <Button title="Go back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const next = setup.blocks[bi + 1];
  const nextName = next ? exerciseById.get(next.exerciseId)?.name ?? next.name : null;

  function completeSet() {
    if (isLastSet) {
      if (block!.restSec > 0 && !isLastBlock) setPhase("rest");
      else nextBlock();
    } else {
      setSetIdx(setIdx + 1);
      if (block!.seconds) setTimeLeft(block!.seconds);
    }
  }

  function nextBlock() {
    if (isLastBlock) {
      setPhase("rating");
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    } else {
      setBi(bi + 1);
      setSetIdx(1);
      setPhase("work");
    }
  }

  function save() {
    if (saved || !setup) return;
    setSaved(true);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    logWorkout({
      planId: setup.planId,
      title: setup.title,
      date: new Date().toISOString(),
      minutes: setup.forTime ? minutes : Math.max(5, Math.round(elapsed / 60)),
      blocksDone: setup.blocks.length,
      blocksTotal: setup.blocks.length,
      difficulty: rating ?? undefined,
      notes: notes.trim() || undefined,
      benchmarkId: setup.benchmarkId,
      benchmarkSec: setup.forTime ? elapsed : undefined,
    });
    const adapt = rating ? adaptationForRating(rating) : null;
    router.back();
    // Surface the adaptation note as a coach message after save
    if (adapt) {
      useForge.getState().sendChat(
        `I finished "${setup.title}" — rated ${rating!.replace("_", " ")}.`,
        `${adapt.note} (This is how your plan learns — the next session is already adjusted.)`,
        "template",
      );
    }
  }

  if (phase === "rating") {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Title>Done. 💪</Title>
          <Muted style={{ marginTop: 6, marginBottom: 4 }}>
            {setup.forTime ? `Total time: ${fmtDuration(elapsed)}` : `${setup.blocks.length} blocks · ${fmtDuration(elapsed)}`}
          </Muted>
          <Body style={{ fontWeight: "700", marginTop: 16, marginBottom: 10 }}>How was it?</Body>
          <Row gap={8} style={{ marginBottom: 16 }}>
            {(["too_easy", "just_right", "too_hard"] as DifficultyRating[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRating(r)}
                style={[styles.rateBtn, rating === r && styles.rateBtnOn]}
              >
                <Text style={[styles.rateText, rating === r && styles.rateTextOn]}>
                  {r === "too_easy" ? "Too easy" : r === "just_right" ? "Just right" : "Too hard"}
                </Text>
              </Pressable>
            ))}
          </Row>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            placeholderTextColor={C.muted}
            style={styles.input}
          />
          <Button title="Save session" onPress={save} disabled={!rating} style={{ alignSelf: "stretch", marginTop: 12 }} />
          {!rating && <Muted style={{ marginTop: 8 }}>Pick a difficulty — it tunes your next session.</Muted>}
        </View>
      </SafeAreaView>
    );
  }

  const progress = (bi + (setIdx - 1) / Math.max(1, block.sets)) / setup.blocks.length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={C.text} />
        </Pressable>
        <Muted>
          {bi + 1} / {setup.blocks.length}
        </Muted>
        {setup.forTime ? (
          <Text style={styles.clock}>{fmtDuration(elapsed)}</Text>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>
      <ProgressBar value={progress * 100} max={100} style={{ marginHorizontal: 20 }} />

      <View style={styles.stage}>
        {phase === "rest" ? (
          <>
            <Text style={styles.restLabel}>REST</Text>
            <Text style={styles.timer}>{timeLeft ?? 0}s</Text>
            <Muted style={{ marginTop: 8 }}>Next: {nextName ?? "—"}</Muted>
            <Button title="Skip rest" variant="secondary" onPress={nextBlock} style={{ marginTop: 20, alignSelf: "stretch" }} />
          </>
        ) : (
          <>
            <Text style={styles.exName}>{block.name}</Text>
            <Muted style={{ marginBottom: 6 }}>
              Set {setIdx} of {block.sets}
              {block.reps ? ` · ${block.reps} reps` : ""}
            </Muted>
            {block.seconds ? (
              <Text style={styles.timer}>{timeLeft ?? block.seconds}s</Text>
            ) : (
              <Text style={styles.reps}>{block.reps}</Text>
            )}
            <Card style={{ alignSelf: "stretch", marginTop: 16 }}>
              {block.cues.slice(0, 3).map((c, i) => (
                <Text key={i} style={styles.cue}>• {c}</Text>
              ))}
            </Card>
            <Button
              title={isLastSet && isLastBlock ? "Finish" : block.seconds ? "Done" : "Complete set"}
              onPress={completeSet}
              style={{ alignSelf: "stretch", marginTop: 8 }}
            />
            <Pressable onPress={nextBlock} style={{ marginTop: 12 }}>
              <Text style={{ color: C.muted, fontWeight: "600" }}>Skip exercise →</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  clock: { color: C.gold, fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  exName: { color: C.text, fontSize: 30, fontWeight: "800", textAlign: "center", letterSpacing: -0.5 },
  timer: { color: C.accent, fontSize: 84, fontWeight: "800", fontVariant: ["tabular-nums"] },
  reps: { color: C.text, fontSize: 84, fontWeight: "800", fontVariant: ["tabular-nums"] },
  restLabel: { color: C.teal, fontSize: 16, fontWeight: "800", letterSpacing: 4 },
  cue: { color: C.text, fontSize: 14, marginBottom: 6, lineHeight: 20 },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
    alignSelf: "stretch",
  },
  rateBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  rateBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  rateText: { color: C.muted, fontWeight: "700", fontSize: 13 },
  rateTextOn: { color: "#14100B" },
});
