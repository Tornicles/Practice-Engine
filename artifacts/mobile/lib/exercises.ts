import type { Equipment, EquipmentKey, Exercise, MuscleGroup } from "./types";

// Tagged exercise graph for generative session assembly.
// Every entry is home-friendly: bodyweight or minimal equipment only.
export const EXERCISES: Exercise[] = [
  { id: "pushup", name: "Push-up", muscles: ["chest", "arms", "shoulders"], pattern: "push", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Body in one straight line", "Chest to fist-height", "Elbows ~45°"], regressTo: "knee-pushup", progressTo: "diamond-pushup" },
  { id: "knee-pushup", name: "Knee push-up", muscles: ["chest", "arms"], pattern: "push", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Hips forward, no sag", "Full range of motion"], progressTo: "pushup" },
  { id: "diamond-pushup", name: "Diamond push-up", muscles: ["chest", "arms"], pattern: "push", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hands form a diamond under chest", "Keep elbows tucked"], regressTo: "pushup", progressTo: "archer-pushup" },
  { id: "archer-pushup", name: "Archer push-up", muscles: ["chest", "arms", "shoulders"], pattern: "push", equipment: ["bodyweight"], level: 3, impact: "low", cues: ["One arm straight, one bends", "Alternate sides"], regressTo: "diamond-pushup" },
  { id: "pike-pushup", name: "Pike push-up", muscles: ["shoulders", "arms"], pattern: "push", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hips high, head between arms", "Top of head toward floor"], regressTo: "pushup", progressTo: "wall-hspu" },
  { id: "wall-hspu", name: "Wall handstand push-up", muscles: ["shoulders", "arms"], pattern: "push", equipment: ["bodyweight"], level: 3, impact: "low", cues: ["Kick up against a wall", "Bend elbows to 90°"], regressTo: "pike-pushup" },
  { id: "chair-dip", name: "Chair dip", muscles: ["arms", "shoulders"], pattern: "push", equipment: ["chair"], level: 1, impact: "low", cues: ["Hands on chair edge", "Lower until elbows hit 90°"], regressTo: "knee-pushup" },
  { id: "db-press", name: "Dumbbell floor press", muscles: ["chest", "arms"], pattern: "push", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["Back flat on floor", "Press up, don't lock hard"] },
  { id: "db-ohp", name: "Dumbbell overhead press", muscles: ["shoulders", "arms"], pattern: "push", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["Ribs down, glutes tight", "Press straight overhead"] },
  { id: "band-press", name: "Band chest press", muscles: ["chest", "arms"], pattern: "push", equipment: ["bands"], level: 1, impact: "low", cues: ["Band behind back, handles at chest", "Press forward, squeeze"] },
  { id: "band-ohp", name: "Band overhead press", muscles: ["shoulders"], pattern: "push", equipment: ["bands"], level: 2, impact: "low", cues: ["Stand on band center", "Press up without arching"] },
  { id: "superman", name: "Superman pull", muscles: ["back"], pattern: "pull", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Lift chest and legs together", "Squeeze shoulder blades"] },
  { id: "band-row", name: "Band row", muscles: ["back", "arms"], pattern: "pull", equipment: ["bands"], level: 1, impact: "low", cues: ["Anchor band at chest height", "Pull elbows past ribs"] },
  { id: "db-row", name: "Dumbbell bent-over row", muscles: ["back", "arms"], pattern: "pull", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["Hinge at hips, flat back", "Pull to hip pocket"] },
  { id: "pullup", name: "Pull-up", muscles: ["back", "arms"], pattern: "pull", equipment: ["pullupBar"], level: 3, impact: "low", cues: ["Dead hang start", "Chest to bar"], regressTo: "band-row" },
  { id: "band-curl", name: "Band bicep curl", muscles: ["arms"], pattern: "pull", equipment: ["bands"], level: 1, impact: "low", cues: ["Elbows pinned to ribs", "Slow lower"] },
  { id: "db-curl", name: "Dumbbell curl", muscles: ["arms"], pattern: "pull", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["No swinging", "Full stretch at bottom"] },
  { id: "squat", name: "Bodyweight squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Knees track over toes", "Hips below knees if mobility allows"], progressTo: "jump-squat" },
  { id: "goblet-squat", name: "Goblet squat", muscles: ["legs", "glutes", "core"], pattern: "squat", equipment: ["dumbbells", "kettlebell"], level: 1, impact: "low", cues: ["Weight at chest", "Elbows inside knees at bottom"] },
  { id: "split-squat", name: "Split squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Long stance, torso tall", "Back knee toward floor"], regressTo: "squat", progressTo: "bulgarian-split" },
  { id: "bulgarian-split", name: "Bulgarian split squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["chair"], level: 3, impact: "low", cues: ["Rear foot on chair", "Front knee stable"], regressTo: "split-squat" },
  { id: "jump-squat", name: "Jump squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Soft landing, quiet feet", "Reset each rep"], regressTo: "squat" },
  { id: "glute-bridge", name: "Glute bridge", muscles: ["glutes", "core"], pattern: "hinge", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Squeeze glutes at top", "No back arch"], progressTo: "single-leg-bridge" },
  { id: "single-leg-bridge", name: "Single-leg glute bridge", muscles: ["glutes"], pattern: "hinge", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hips level", "Drive through heel"], regressTo: "glute-bridge" },
  { id: "rdl", name: "Dumbbell Romanian deadlift", muscles: ["glutes", "back", "legs"], pattern: "hinge", equipment: ["dumbbells"], level: 2, impact: "low", cues: ["Hips back, slight knee bend", "Feel hamstrings load"] },
  { id: "kb-swing", name: "Kettlebell swing", muscles: ["glutes", "back", "full"], pattern: "hinge", equipment: ["kettlebell"], level: 2, impact: "low", cues: ["Hike, snap hips", "Arms are ropes"] },
  { id: "band-pullthrough", name: "Band pull-through", muscles: ["glutes"], pattern: "hinge", equipment: ["bands"], level: 1, impact: "low", cues: ["Hinge, don't squat", "Squeeze hard at top"] },
  { id: "plank", name: "Plank", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Ribs down, glutes on", "Breathe behind the brace"], progressTo: "plank-shoulder-tap" },
  { id: "dead-bug", name: "Dead bug", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Low back pressed to floor", "Exhale as you extend"] },
  { id: "plank-shoulder-tap", name: "Plank shoulder tap", muscles: ["core", "shoulders"], pattern: "core", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hips don't rotate", "Slow taps"], regressTo: "plank" },
  { id: "bicycle", name: "Bicycle crunch", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Rotate, don't yank neck", "Slow and controlled"] },
  { id: "hollow-hold", name: "Hollow body hold", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Low back glued down", "Shoulders off floor"], regressTo: "dead-bug" },
  { id: "mountain-climber", name: "Mountain climbers", muscles: ["core", "full"], pattern: "cardio", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Hips low, drive knees fast", "Quiet feet"], regressTo: "plank" },
  { id: "burpee", name: "Burpee", muscles: ["full"], pattern: "cardio", equipment: ["bodyweight"], level: 3, impact: "high", cues: ["Chest to floor, jump at top", "Scale the jump if needed"], regressTo: "mountain-climber" },
  { id: "jumping-jack", name: "Jumping jack", muscles: ["full"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "high", cues: ["Light on feet", "Full arm range"] },
  { id: "high-knees", name: "High knees", muscles: ["legs", "full"], pattern: "cardio", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Knees to hip height", "Pump arms"] },
  { id: "skater", name: "Skater hop", muscles: ["legs", "glutes"], pattern: "cardio", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Lateral push, stick landing", "Stay low"] },
  { id: "step-up", name: "Chair step-up", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["chair"], level: 1, impact: "low", cues: ["Drive through heel", "Control the way down"] },
  { id: "calf-raise", name: "Calf raise", muscles: ["legs"], pattern: "squat", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Pause at top", "Slow lower"] },
  { id: "wall-sit", name: "Wall sit", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Thighs parallel", "Back flat on wall"] },
];

export const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));

export function filterExercises(opts: {
  equipment: Equipment;
  level?: 1 | 2 | 3;
  impact?: "low";
  muscles?: MuscleGroup[];
  excludeIds?: string[];
}): Exercise[] {
  const owned: EquipmentKey[] = (Object.keys(opts.equipment) as EquipmentKey[]).filter(
    (k) => opts.equipment[k],
  );
  return EXERCISES.filter((e) => {
    if (!e.equipment.every((eq) => owned.includes(eq))) return false;
    if (opts.level && e.level > opts.level) return false;
    if (opts.impact === "low" && e.impact !== "low") return false;
    if (opts.muscles?.length && !e.muscles.some((m) => opts.muscles!.includes(m))) return false;
    if (opts.excludeIds?.includes(e.id)) return false;
    return true;
  });
}

// Deterministic template builder: used when AI is unavailable and as a seed
// for AI adaptation. Never invents exercises outside the library.
export function buildTemplateSession(opts: {
  focus: "upper" | "lower" | "full" | "core" | "conditioning";
  minutes: 15 | 20 | 30 | 45;
  equipment: Equipment;
  level: 1 | 2 | 3;
  lowImpact?: boolean;
}): { title: string; blocks: { exerciseId: string; sets: number; reps?: number; seconds?: number; restSec: number }[] } {
  const muscleMap: Record<string, MuscleGroup[]> = {
    upper: ["chest", "back", "shoulders", "arms"],
    lower: ["legs", "glutes"],
    full: ["full", "legs", "chest", "back", "core"],
    core: ["core"],
    conditioning: ["full", "legs", "core"],
  };
  const pool = filterExercises({
    equipment: opts.equipment,
    level: opts.level,
    impact: opts.lowImpact ? "low" : undefined,
    muscles: muscleMap[opts.focus],
  });
  const count = opts.minutes <= 15 ? 4 : opts.minutes <= 20 ? 5 : opts.minutes <= 30 ? 6 : 8;
  const picked = pool.slice(0, Math.max(count, 1));
  const blocks = picked.map((e, i) => {
    const isCore = e.pattern === "core";
    const isCardio = e.pattern === "cardio";
    return {
      exerciseId: e.id,
      sets: opts.level >= 3 ? 4 : 3,
      ...(isCore || isCardio ? { seconds: 40 } : { reps: opts.level === 1 ? 10 : 12 }),
      restSec: i === picked.length - 1 ? 0 : 45,
    };
  });
  const focusLabel = { upper: "Upper body", lower: "Lower body", full: "Full body", core: "Core crusher", conditioning: "Conditioning" }[opts.focus];
  return { title: `${focusLabel} · ${opts.minutes} min`, blocks };
}
