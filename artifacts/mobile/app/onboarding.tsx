import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { C } from "../components/theme";
import { Body, Button, Chip, Muted, Row, Title } from "../components/ui";
import { adaptForOccupation, planRunProgression, suggestWorkoutDraft } from "../lib/ai";
import { occupationAdaptation } from "../lib/engine";
import { uid } from "../lib/format";
import { useForge } from "../lib/store";
import type {
  AppSettings,
  AvatarSpec,
  DietaryPrefs,
  DietKind,
  Equipment,
  EquipmentKey,
  FitnessGoal,
  FitnessLevel,
  OccupationProfile,
  Sex,
  UserProfile,
  WorkoutPlan,
  WorkType,
} from "../lib/types";
import {
  AVATAR_COLORS,
  AVATAR_STYLE_LABELS,
  DIET_LABELS,
  EQUIPMENT_LABELS,
  FITNESS_LEVEL_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  WORK_TYPE_LABELS,
  type AvatarStyle,
} from "../lib/types";

const STEPS = ["You", "Goal", "Gear", "Work", "Time", "Body & fuel", "Avatar", "Ready"];

function Q({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.q}>{title}</Text>
      {sub ? <Muted style={{ marginTop: 4, marginBottom: 12 }}>{sub}</Muted> : <View style={{ height: 12 }} />}
      {children}
    </View>
  );
}

function Field({ value, onChange, placeholder, numeric, multiline }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      keyboardType={numeric ? "numeric" : "default"}
      multiline={multiline}
      style={[styles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
    />
  );
}

export default function Onboarding() {
  const completeOnboarding = useForge((s) => s.completeOnboarding);
  const setAvatarPhoto = useForge((s) => s.setAvatarPhoto);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // step 0
  const [name, setName] = useState("");
  const [age, setAge] = useState("29");
  const [sex, setSex] = useState<Sex>("male");
  const [heightCm, setHeightCm] = useState("178");
  const [weightKg, setWeightKg] = useState("80");
  // step 1
  const [goal, setGoal] = useState<FitnessGoal>("lose");
  const [goalDetail, setGoalDetail] = useState("");
  // step 2
  const [equipment, setEquipment] = useState<Equipment>({ bodyweight: true, dumbbells: false, bands: false, chair: true, pullupBar: false, kettlebell: false });
  const [level, setLevel] = useState<FitnessLevel>("beginner");
  const [pushups, setPushups] = useState("");
  // step 3
  const [workType, setWorkType] = useState<WorkType>("sedentary");
  const [jobLabel, setJobLabel] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [trainingTime, setTrainingTime] = useState<"morning" | "lunch" | "evening">("morning");
  // step 4
  const [minutes, setMinutes] = useState<20 | 30>(30);
  const [runGoal, setRunGoal] = useState<"5k" | "10k" | "habit">("5k");
  // step 5
  const [injuries, setInjuries] = useState("");
  const [diet, setDiet] = useState<DietKind>("omnivore");
  const [allergies, setAllergies] = useState("");
  const [dislikes, setDislikes] = useState("");
  // step 6
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("bolt");
  const [skin, setSkin] = useState("#c98d64");
  const [color, setColor] = useState("#ff6b35");
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const toggleEquip = (k: EquipmentKey) => setEquipment((e) => ({ ...e, [k]: !e[k] }));

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const finish = async () => {
    setBusy(true);
    try {
      const profile: UserProfile = {
        name: name.trim(),
        age: Math.max(13, parseInt(age) || 29),
        sex,
        heightCm: parseInt(heightCm) || 175,
        weightKg: parseInt(weightKg) || 75,
        goal,
        goalDetail: goalDetail.trim() || GOAL_LABELS[goal],
        fitnessLevel: level,
        injuries: injuries.trim(),
        avatar: { skin, color, style: avatarStyle } as AvatarSpec,
      };
      const occupation: OccupationProfile = {
        workType,
        label: jobLabel.trim() || WORK_TYPE_LABELS[workType],
        hoursPerDay: Math.min(16, Math.max(1, parseInt(hoursPerDay) || 8)),
        workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        preferredTrainingTime: trainingTime,
        shiftWork: workType === "shift",
        shiftNotes: "",
      };
      const dietary: DietaryPrefs = {
        diet,
        allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
        dislikes: dislikes.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const settings: AppSettings = {
        units: "metric",
        reminders: true,
        reminderHour: trainingTime === "morning" ? 7 : trainingTime === "lunch" ? 12 : 18,
        reminderMinute: 0,
        coachPersona: "steady",
      };
      const lvl = level === "beginner" ? 1 : level === "intermediate" ? 2 : 3;
      const occNote = occupationAdaptation(occupation);
      const w = await suggestWorkoutDraft({
        focus: goal === "endurance" ? "conditioning" : "full",
        minutes: minutes as 15 | 20 | 30 | 45,
        level: lvl as 1 | 2 | 3,
        equipment,
        injuries: injuries.trim(),
        occupationNote: occNote,
      });
      const workoutPlan: WorkoutPlan = {
        id: uid("wp"),
        title: w.ok ? w.data.title : `Full body · ${minutes} min`,
        focus: "Full body",
        minutes,
        level,
        blocks: w.ok ? w.data.blocks : [],
        status: "active",
        source: w.ok ? w.source : "template",
        createdAt: new Date().toISOString(),
        adaptedNote: occNote,
      };
      const r = await planRunProgression(runGoal, 0, 3);
      const runPlan = {
        id: uid("rp"),
        title: r.ok ? r.data.title : "Couch to 5K",
        goal: runGoal,
        weeks: r.ok ? r.data.weeks : [],
        currentWeek: 1,
        status: "draft" as const,
        source: r.ok ? r.source : ("template" as const),
        createdAt: new Date().toISOString(),
      };
      // Fire-and-forget occupation coaching note into drafts hub
      adaptForOccupation(occupation, workoutPlan.title).catch(() => {});
      completeOnboarding({ profile, occupation, equipment, dietary, settings, workoutPlan, runPlan });
      if (photoUri) setAvatarPhoto(photoUri);
      router.replace("/(tabs)");
    } finally {
      setBusy(false);
    }
  };

  const spec: AvatarSpec = { skin, color, style: avatarStyle };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Title>Forge</Title>
        <Muted>
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </Muted>
      </View>
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <Q title="Who are we training?" sub="Basics so plans fit your body.">
            <Field value={name} onChange={setName} placeholder="Your name" />
            <Row gap={10} style={{ marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Muted>Age</Muted>
                <Field value={age} onChange={setAge} numeric placeholder="29" />
              </View>
              <View style={{ flex: 1 }}>
                <Muted>Height (cm)</Muted>
                <Field value={heightCm} onChange={setHeightCm} numeric placeholder="178" />
              </View>
              <View style={{ flex: 1 }}>
                <Muted>Weight (kg)</Muted>
                <Field value={weightKg} onChange={setWeightKg} numeric placeholder="80" />
              </View>
            </Row>
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>Sex</Muted>
            <Row gap={8}>
              {(Object.keys(SEX_LABELS) as Sex[]).map((s) => (
                <Chip key={s} label={SEX_LABELS[s]} selected={sex === s} onPress={() => setSex(s)} />
              ))}
            </Row>
          </Q>
        )}

        {step === 1 && (
          <Q title="What's the mission?" sub="One goal keeps the plan honest.">
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => (
                <Chip key={g} label={GOAL_LABELS[g]} selected={goal === g} onPress={() => setGoal(g)} style={{ marginBottom: 8 }} />
              ))}
            </Row>
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>In your words (optional)</Muted>
            <Field value={goalDetail} onChange={setGoalDetail} placeholder="e.g. Run 5K without stopping by spring" multiline />
          </Q>
        )}

        {step === 2 && (
          <Q title="What gear do you have?" sub="Home workouts only — we'll never program what you don't own.">
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((k) => (
                <Chip key={k} label={EQUIPMENT_LABELS[k]} selected={equipment[k]} onPress={() => toggleEquip(k)} style={{ marginBottom: 8 }} />
              ))}
            </Row>
            <Muted style={{ marginTop: 16, marginBottom: 8 }}>Fitness level</Muted>
            <Row gap={8}>
              {(Object.keys(FITNESS_LEVEL_LABELS) as FitnessLevel[]).map((l) => (
                <Chip key={l} label={FITNESS_LEVEL_LABELS[l]} selected={level === l} onPress={() => setLevel(l)} />
              ))}
            </Row>
            <Muted style={{ marginTop: 16, marginBottom: 8 }}>Max push-ups in one go (benchmark — be honest)</Muted>
            <Field value={pushups} onChange={(v) => {
              setPushups(v);
              const n = parseInt(v) || 0;
              setLevel(n >= 25 ? "advanced" : n >= 10 ? "intermediate" : "beginner");
            }} numeric placeholder="e.g. 12" />
          </Q>
        )}

        {step === 3 && (
          <Q title="What does your work look like?" sub="Your job shapes your calories, recovery, and schedule. Nobody else asks this.">
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              {(Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((w) => (
                <Chip key={w} label={WORK_TYPE_LABELS[w]} selected={workType === w} onPress={() => setWorkType(w)} style={{ marginBottom: 8 }} />
              ))}
            </Row>
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>Job title (optional)</Muted>
            <Field value={jobLabel} onChange={setJobLabel} placeholder="e.g. Nurse, night shift" />
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>Hours per work day</Muted>
            <Field value={hoursPerDay} onChange={setHoursPerDay} numeric placeholder="8" />
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>Preferred training time</Muted>
            <Row gap={8}>
              {(["morning", "lunch", "evening"] as const).map((t) => (
                <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} selected={trainingTime === t} onPress={() => setTrainingTime(t)} />
              ))}
            </Row>
          </Q>
        )}

        {step === 4 && (
          <Q title="How much time do we get?" sub="Short and consistent beats long and skipped.">
            <Muted style={{ marginBottom: 8 }}>Minutes per session</Muted>
            <Row gap={8}>
              {([20, 30] as const).map((m) => (
                <Chip key={m} label={`${m} min`} selected={minutes === m} onPress={() => setMinutes(m)} />
              ))}
            </Row>
            <Muted style={{ marginTop: 16, marginBottom: 8 }}>Running goal</Muted>
            <Row gap={8}>
              {(["5k", "10k", "habit"] as const).map((g) => (
                <Chip
                  key={g}
                  label={g === "5k" ? "Couch to 5K" : g === "10k" ? "Base to 10K" : "Just run regularly"}
                  selected={runGoal === g}
                  onPress={() => setRunGoal(g)}
                />
              ))}
            </Row>
            <View style={styles.note}>
              <Body>Training rhythm: strength Mon / Wed / Fri, runs Tue / Thu / Sat, Sunday off. The plan adapts to your ratings.</Body>
            </View>
          </Q>
        )}

        {step === 5 && (
          <Q title="Body & fuel" sub="Injuries route around pain; diet shapes your grocery plans.">
            <Muted style={{ marginBottom: 8 }}>Injuries or limitations (optional)</Muted>
            <Field value={injuries} onChange={setInjuries} placeholder="e.g. sore right knee on deep squats" multiline />
            <Muted style={{ marginTop: 16, marginBottom: 8 }}>Diet</Muted>
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              {(Object.keys(DIET_LABELS) as DietKind[]).map((d) => (
                <Chip key={d} label={DIET_LABELS[d]} selected={diet === d} onPress={() => setDiet(d)} style={{ marginBottom: 8 }} />
              ))}
            </Row>
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>Allergies (comma separated)</Muted>
            <Field value={allergies} onChange={setAllergies} placeholder="e.g. peanuts, shellfish" />
            <Muted style={{ marginTop: 12, marginBottom: 8 }}>Foods you dislike</Muted>
            <Field value={dislikes} onChange={setDislikes} placeholder="e.g. mushrooms" />
          </Q>
        )}

        {step === 6 && (
          <Q title="Meet your avatar" sub="It evolves as you train: Spark → Ember → Forge → Titan.">
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Avatar spec={spec} stage="spark" photoUri={photoUri} size={120} />
              <Pressable onPress={pickPhoto} style={styles.photoBtn}>
                <Text style={styles.photoBtnText}>{photoUri ? "Change photo" : "Upload a photo (optional)"}</Text>
              </Pressable>
            </View>
            <Muted style={{ marginBottom: 8 }}>Style</Muted>
            <Row gap={8} style={{ marginBottom: 12 }}>
              {(Object.keys(AVATAR_STYLE_LABELS) as AvatarStyle[]).map((s) => (
                <Chip key={s} label={AVATAR_STYLE_LABELS[s]} selected={avatarStyle === s} onPress={() => setAvatarStyle(s)} />
              ))}
            </Row>
            <Muted style={{ marginBottom: 8 }}>Skin tone</Muted>
            <Row gap={10} style={{ marginBottom: 12 }}>
              {["#f1c9a5", "#e0ac82", "#c98d64", "#a06a42", "#6f452b"].map((t) => (
                <Pressable key={t} onPress={() => setSkin(t)} style={[styles.swatch, { backgroundColor: t }, skin === t && styles.swatchOn]} />
              ))}
            </Row>
            <Muted style={{ marginBottom: 8 }}>Accent color</Muted>
            <Row gap={10} style={{ flexWrap: "wrap" }}>
              {AVATAR_COLORS.map((t) => (
                <Pressable key={t} onPress={() => setColor(t)} style={[styles.swatch, { backgroundColor: t }, color === t && styles.swatchOn]} />
              ))}
            </Row>
          </Q>
        )}

        {step === 7 && (
          <Q title="Ready to forge?" sub="Here's what happens next.">
            <View style={styles.review}>
              <Body>🏋️  {minutes}-min home plan, built for your gear and work life</Body>
              <Body>🏃  {runGoal === "5k" ? "Couch to 5K" : runGoal === "10k" ? "Base to 10K" : "Run habit"} progression</Body>
              <Body>🍳  Grocery-photo meal plans matched to your diet</Body>
              <Body>🔥  Avatar that levels up with every session</Body>
            </View>
            <Muted style={{ marginTop: 12 }}>
              AI suggests, you decide — every generated plan starts as a draft you approve.
            </Muted>
          </Q>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <Button title="Back" variant="ghost" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button title="Continue" onPress={() => canNext() && setStep(step + 1)} disabled={!canNext()} style={{ flex: 2 }} />
        ) : (
          <Button title={busy ? "Building your plan…" : "Build my plan"} onPress={finish} disabled={busy} style={{ flex: 2 }} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  dots: { flexDirection: "row", gap: 6, paddingHorizontal: 20, marginTop: 10 },
  dot: { flex: 1, height: 4, borderRadius: 99, backgroundColor: C.surface2 },
  dotOn: { backgroundColor: C.accent },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  q: { color: C.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 16,
    marginBottom: 4,
  },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 8, paddingTop: 8 },
  note: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginTop: 20 },
  review: { gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16 },
  photoBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  photoBtnText: { color: C.accent, fontSize: 13, fontWeight: "700" },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "transparent" },
  swatchOn: { borderColor: C.text },
});
