import type {
  ChallengeDay,
  ChallengeDef,
  Equipment,
  EquipmentKey,
  Exercise,
  MuscleGroup,
  MuscleProgram,
  Segment,
  WorkoutBlock,
} from "./types";

// Tagged exercise graph for generative session assembly.
// Every entry is home-friendly: bodyweight or minimal equipment only.
//
// `anim` is the movement archetype consumed by <ExerciseAnimation />.
// `group` is the Leap-style muscle program the exercise belongs to.
export const EXERCISES: Exercise[] = [
  { id: "pushup", name: "Push-up", muscles: ["chest", "arms", "shoulders"], pattern: "push", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Body in one straight line", "Chest to fist-height", "Elbows ~45°"], regressTo: "knee-pushup", progressTo: "diamond-pushup", anim: "pushup", group: "chest" },
  { id: "knee-pushup", name: "Knee push-up", muscles: ["chest", "arms"], pattern: "push", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Hips forward, no sag", "Full range of motion"], progressTo: "pushup", anim: "pushup", group: "chest" },
  { id: "diamond-pushup", name: "Diamond push-up", muscles: ["chest", "arms"], pattern: "push", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hands form a diamond under chest", "Keep elbows tucked"], regressTo: "pushup", progressTo: "archer-pushup", anim: "pushup", group: "chest" },
  { id: "archer-pushup", name: "Archer push-up", muscles: ["chest", "arms", "shoulders"], pattern: "push", equipment: ["bodyweight"], level: 3, impact: "low", cues: ["One arm straight, one bends", "Alternate sides"], regressTo: "diamond-pushup", anim: "pushup", group: "chest" },
  { id: "pike-pushup", name: "Pike push-up", muscles: ["shoulders", "arms"], pattern: "push", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hips high, head between arms", "Top of head toward floor"], regressTo: "pushup", progressTo: "wall-hspu", anim: "pushup", group: "arms" },
  { id: "wall-hspu", name: "Wall handstand push-up", muscles: ["shoulders", "arms"], pattern: "push", equipment: ["bodyweight"], level: 3, impact: "low", cues: ["Kick up against a wall", "Bend elbows to 90°"], regressTo: "pike-pushup", anim: "pushup", group: "arms" },
  { id: "chair-dip", name: "Chair dip", muscles: ["arms", "shoulders"], pattern: "push", equipment: ["chair"], level: 1, impact: "low", cues: ["Hands on chair edge", "Lower until elbows hit 90°"], regressTo: "knee-pushup", anim: "pushup", group: "arms" },
  { id: "db-press", name: "Dumbbell floor press", muscles: ["chest", "arms"], pattern: "push", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["Back flat on floor", "Press up, don't lock hard"], anim: "pushup", group: "chest" },
  { id: "db-ohp", name: "Dumbbell overhead press", muscles: ["shoulders", "arms"], pattern: "push", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["Ribs down, glutes tight", "Press straight overhead"], anim: "pushup", group: "arms" },
  { id: "band-press", name: "Band chest press", muscles: ["chest", "arms"], pattern: "push", equipment: ["bands"], level: 1, impact: "low", cues: ["Band behind back, handles at chest", "Press forward, squeeze"], anim: "pushup", group: "chest" },
  { id: "band-ohp", name: "Band overhead press", muscles: ["shoulders"], pattern: "push", equipment: ["bands"], level: 2, impact: "low", cues: ["Stand on band center", "Press up without arching"], anim: "pushup", group: "arms" },
  { id: "superman", name: "Superman pull", muscles: ["back"], pattern: "pull", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Lift chest and legs together", "Squeeze shoulder blades"], anim: "legRaise", group: "fullbody" },
  { id: "band-row", name: "Band row", muscles: ["back", "arms"], pattern: "pull", equipment: ["bands"], level: 1, impact: "low", cues: ["Anchor band at chest height", "Pull elbows past ribs"], anim: "row", group: "arms" },
  { id: "db-row", name: "Dumbbell bent-over row", muscles: ["back", "arms"], pattern: "pull", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["Hinge at hips, flat back", "Pull to hip pocket"], anim: "row", group: "arms" },
  { id: "pullup", name: "Pull-up", muscles: ["back", "arms"], pattern: "pull", equipment: ["pullupBar"], level: 3, impact: "low", cues: ["Dead hang start", "Chest to bar"], regressTo: "band-row", anim: "pullup", group: "arms" },
  { id: "band-curl", name: "Band bicep curl", muscles: ["arms"], pattern: "pull", equipment: ["bands"], level: 1, impact: "low", cues: ["Elbows pinned to ribs", "Slow lower"], anim: "curl", group: "arms" },
  { id: "db-curl", name: "Dumbbell curl", muscles: ["arms"], pattern: "pull", equipment: ["dumbbells"], level: 1, impact: "low", cues: ["No swinging", "Full stretch at bottom"], anim: "curl", group: "arms" },
  { id: "squat", name: "Bodyweight squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Knees track over toes", "Hips below knees if mobility allows"], progressTo: "jump-squat", anim: "squat", group: "legs" },
  { id: "goblet-squat", name: "Goblet squat", muscles: ["legs", "glutes", "core"], pattern: "squat", equipment: ["dumbbells", "kettlebell"], level: 1, impact: "low", cues: ["Weight at chest", "Elbows inside knees at bottom"], anim: "squat", group: "legs" },
  { id: "split-squat", name: "Split squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Long stance, torso tall", "Back knee toward floor"], regressTo: "squat", progressTo: "bulgarian-split", anim: "lunge", group: "legs" },
  { id: "bulgarian-split", name: "Bulgarian split squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["chair"], level: 3, impact: "low", cues: ["Rear foot on chair", "Front knee stable"], regressTo: "split-squat", anim: "lunge", group: "legs" },
  { id: "jump-squat", name: "Jump squat", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Soft landing, quiet feet", "Reset each rep"], regressTo: "squat", anim: "squat", group: "legs" },
  { id: "glute-bridge", name: "Glute bridge", muscles: ["glutes", "core"], pattern: "hinge", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Squeeze glutes at top", "No back arch"], progressTo: "single-leg-bridge", anim: "gluteBridge", group: "butt" },
  { id: "single-leg-bridge", name: "Single-leg glute bridge", muscles: ["glutes"], pattern: "hinge", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hips level", "Drive through heel"], regressTo: "glute-bridge", anim: "gluteBridge", group: "butt" },
  { id: "rdl", name: "Dumbbell Romanian deadlift", muscles: ["glutes", "back", "legs"], pattern: "hinge", equipment: ["dumbbells"], level: 2, impact: "low", cues: ["Hips back, slight knee bend", "Feel hamstrings load"], anim: "hinge", group: "butt" },
  { id: "kb-swing", name: "Kettlebell swing", muscles: ["glutes", "back", "full"], pattern: "hinge", equipment: ["kettlebell"], level: 2, impact: "low", cues: ["Hike, snap hips", "Arms are ropes"], anim: "hinge", group: "butt" },
  { id: "band-pullthrough", name: "Band pull-through", muscles: ["glutes"], pattern: "hinge", equipment: ["bands"], level: 1, impact: "low", cues: ["Hinge, don't squat", "Squeeze hard at top"], anim: "hinge", group: "butt" },
  { id: "plank", name: "Plank", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Ribs down, glutes on", "Breathe behind the brace"], progressTo: "plank-shoulder-tap", anim: "plank", group: "abs" },
  { id: "dead-bug", name: "Dead bug", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Low back pressed to floor", "Exhale as you extend"], anim: "legRaise", group: "abs" },
  { id: "plank-shoulder-tap", name: "Plank shoulder tap", muscles: ["core", "shoulders"], pattern: "core", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Hips don't rotate", "Slow taps"], regressTo: "plank", anim: "plank", group: "abs" },
  { id: "bicycle", name: "Bicycle crunch", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Rotate, don't yank neck", "Slow and controlled"], anim: "crunch", group: "abs" },
  { id: "hollow-hold", name: "Hollow body hold", muscles: ["core"], pattern: "core", equipment: ["bodyweight"], level: 2, impact: "low", cues: ["Low back glued down", "Shoulders off floor"], regressTo: "dead-bug", anim: "crunch", group: "abs" },
  { id: "mountain-climber", name: "Mountain climbers", muscles: ["core", "full"], pattern: "cardio", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Hips low, drive knees fast", "Quiet feet"], regressTo: "plank", anim: "mountainClimber", group: "fullbody" },
  { id: "burpee", name: "Burpee", muscles: ["full"], pattern: "cardio", equipment: ["bodyweight"], level: 3, impact: "high", cues: ["Chest to floor, jump at top", "Scale the jump if needed"], regressTo: "mountain-climber", anim: "burpee", group: "fullbody" },
  { id: "jumping-jack", name: "Jumping jack", muscles: ["full"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "high", cues: ["Light on feet", "Full arm range"], anim: "jumpingJack", group: "fullbody" },
  { id: "high-knees", name: "High knees", muscles: ["legs", "full"], pattern: "cardio", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Knees to hip height", "Pump arms"], anim: "highKnees", group: "legs" },
  { id: "skater", name: "Skater hop", muscles: ["legs", "glutes"], pattern: "cardio", equipment: ["bodyweight"], level: 2, impact: "high", cues: ["Lateral push, stick landing", "Stay low"], anim: "lunge", group: "legs" },
  { id: "step-up", name: "Chair step-up", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["chair"], level: 1, impact: "low", cues: ["Drive through heel", "Control the way down"], anim: "lunge", group: "legs" },
  { id: "calf-raise", name: "Calf raise", muscles: ["legs"], pattern: "squat", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Pause at top", "Slow lower"], anim: "calfRaise", group: "legs" },
  { id: "wall-sit", name: "Wall sit", muscles: ["legs", "glutes"], pattern: "squat", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Thighs parallel", "Back flat on wall"], anim: "squat", group: "legs" },
  // Warm-up / mobility / cool-down moves.
  { id: "arm-circles", name: "Arm circles", muscles: ["shoulders", "full"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Small circles, gradually bigger", "Keep shoulders down", "Reverse direction halfway"], anim: "armCircles", group: "fullbody" },
  { id: "leg-swings", name: "Leg swings", muscles: ["legs"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Hold a wall for balance", "Swing from the hip", "Easy range, no forcing"], anim: "legSwings", group: "legs" },
  { id: "neck-rolls", name: "Neck rolls", muscles: ["full"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Slow half-circles", "Don't crank the neck", "Breathe easy"], anim: "neckRolls", group: "fullbody" },
  { id: "standing-quad-stretch", name: "Standing quad stretch", muscles: ["legs"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Hold a wall for balance", "Knees together, tall torso", "Switch sides halfway"], anim: "quadStretch", group: "legs" },
  { id: "childs-pose", name: "Child's pose", muscles: ["full", "back"], pattern: "cardio", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Hips to heels, arms long", "Forehead to floor", "Breathe into your back"], anim: "childsPose", group: "fullbody" },
  { id: "standing-toe-touch", name: "Standing toe touch", muscles: ["back", "legs"], pattern: "hinge", equipment: ["bodyweight"], level: 1, impact: "low", cues: ["Hinge at hips, soft knees", "Let head hang heavy", "No bouncing"], anim: "hinge", group: "fullbody" },
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

// ---------------------------------------------------------------------------
// Muscle-group programs (Leap-style "train by body part" home screen).
// Bodyweight-first; every block references an exercise id from the library.
// ---------------------------------------------------------------------------

export const MUSCLE_PROGRAMS: MuscleProgram[] = [
  {
    id: "prog-fullbody",
    name: "Full Body",
    tagline: "Head-to-toe strength in one efficient circuit.",
    difficulty: "Beginner",
    minutes: 20,
    blocks: [
      { exerciseId: "jumping-jack", sets: 2, seconds: 30, restSec: 20 },
      { exerciseId: "squat", sets: 3, reps: 12, restSec: 30 },
      { exerciseId: "pushup", sets: 3, reps: 10, restSec: 30 },
      { exerciseId: "glute-bridge", sets: 3, reps: 12, restSec: 30 },
      { exerciseId: "plank", sets: 3, seconds: 30, restSec: 30 },
      { exerciseId: "mountain-climber", sets: 2, seconds: 30, restSec: 30 },
      { exerciseId: "superman", sets: 2, reps: 12, restSec: 0 },
    ],
  },
  {
    id: "prog-abs",
    name: "Abs",
    tagline: "A bulletproof core — no crunches-only nonsense.",
    difficulty: "Beginner",
    minutes: 15,
    blocks: [
      { exerciseId: "plank", sets: 3, seconds: 30, restSec: 20 },
      { exerciseId: "dead-bug", sets: 3, reps: 10, restSec: 20 },
      { exerciseId: "bicycle", sets: 3, reps: 12, restSec: 20 },
      { exerciseId: "hollow-hold", sets: 3, seconds: 20, restSec: 20 },
      { exerciseId: "plank-shoulder-tap", sets: 2, reps: 10, restSec: 20 },
      { exerciseId: "mountain-climber", sets: 2, seconds: 30, restSec: 20 },
      { exerciseId: "superman", sets: 2, reps: 10, restSec: 0 },
    ],
  },
  {
    id: "prog-chest",
    name: "Chest",
    tagline: "Push-up progressions that actually build a chest.",
    difficulty: "Intermediate",
    minutes: 20,
    blocks: [
      { exerciseId: "pushup", sets: 4, reps: 12, restSec: 45 },
      { exerciseId: "diamond-pushup", sets: 3, reps: 8, restSec: 45 },
      { exerciseId: "pike-pushup", sets: 3, reps: 8, restSec: 45 },
      { exerciseId: "chair-dip", sets: 3, reps: 10, restSec: 45 },
      { exerciseId: "plank-shoulder-tap", sets: 2, seconds: 30, restSec: 30 },
      { exerciseId: "superman", sets: 2, reps: 12, restSec: 0 },
    ],
  },
  {
    id: "prog-legs",
    name: "Legs",
    tagline: "Quads, glutes, and calves — no gym required.",
    difficulty: "Intermediate",
    minutes: 20,
    blocks: [
      { exerciseId: "squat", sets: 4, reps: 15, restSec: 40 },
      { exerciseId: "split-squat", sets: 3, reps: 10, restSec: 40 },
      { exerciseId: "glute-bridge", sets: 3, reps: 15, restSec: 40 },
      { exerciseId: "wall-sit", sets: 3, seconds: 30, restSec: 40 },
      { exerciseId: "calf-raise", sets: 3, reps: 15, restSec: 30 },
      { exerciseId: "step-up", sets: 2, reps: 10, restSec: 30 },
      { exerciseId: "skater", sets: 2, seconds: 30, restSec: 0 },
    ],
  },
  {
    id: "prog-arms",
    name: "Arms",
    tagline: "Triceps, biceps, and shoulders with zero weights.",
    difficulty: "Beginner",
    minutes: 15,
    blocks: [
      { exerciseId: "pushup", sets: 3, reps: 10, restSec: 30 },
      { exerciseId: "chair-dip", sets: 3, reps: 10, restSec: 30 },
      { exerciseId: "pike-pushup", sets: 3, reps: 8, restSec: 30 },
      { exerciseId: "plank-shoulder-tap", sets: 3, seconds: 20, restSec: 30 },
      { exerciseId: "superman", sets: 2, reps: 10, restSec: 20 },
      { exerciseId: "diamond-pushup", sets: 2, reps: 8, restSec: 0 },
    ],
  },
  {
    id: "prog-butt",
    name: "Butt",
    tagline: "Glute-focused strength for power and posture.",
    difficulty: "Beginner",
    minutes: 15,
    blocks: [
      { exerciseId: "glute-bridge", sets: 4, reps: 15, restSec: 30 },
      { exerciseId: "squat", sets: 3, reps: 12, restSec: 30 },
      { exerciseId: "single-leg-bridge", sets: 2, reps: 10, restSec: 30 },
      { exerciseId: "split-squat", sets: 2, reps: 10, restSec: 30 },
      { exerciseId: "superman", sets: 2, reps: 12, restSec: 20 },
      { exerciseId: "wall-sit", sets: 2, seconds: 30, restSec: 0 },
    ],
  },
];

export const programById = new Map(MUSCLE_PROGRAMS.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// 30-day challenges. Day plans are generated programmatically with
// progressive overload (reps/seconds scale up week over week) and a rest day
// every 4th day (days 4, 8, 12, 16, 20, 24, 28).
// ---------------------------------------------------------------------------

function challengeDay(day: number, focus: string, blocks: WorkoutBlock[]): ChallengeDay {
  if (day % 4 === 0) return { day, focus: "Recovery", rest: true, blocks: [] };
  return { day, focus, rest: false, blocks };
}

function buildAbsDay(day: number): ChallengeDay {
  const week = Math.min(4, Math.floor((day - 1) / 7)); // 0..4
  const reps = (b: number) => Math.min(30, b + week * 2);
  const secs = (b: number) => Math.min(60, b + week * 5);
  const templates: { focus: string; blocks: WorkoutBlock[] }[] = [
    {
      focus: "Core stability",
      blocks: [
        { exerciseId: "plank", sets: 3, seconds: secs(20), restSec: 30 },
        { exerciseId: "dead-bug", sets: 3, reps: reps(8), restSec: 30 },
        { exerciseId: "bicycle", sets: 3, reps: reps(10), restSec: 0 },
      ],
    },
    {
      focus: "Obliques + control",
      blocks: [
        { exerciseId: "plank-shoulder-tap", sets: 3, reps: reps(8), restSec: 30 },
        { exerciseId: "bicycle", sets: 3, reps: reps(12), restSec: 30 },
        { exerciseId: "hollow-hold", sets: 3, seconds: secs(15), restSec: 0 },
      ],
    },
    {
      focus: "Full core burn",
      blocks: [
        { exerciseId: "mountain-climber", sets: 3, seconds: secs(20), restSec: 30 },
        { exerciseId: "dead-bug", sets: 3, reps: reps(10), restSec: 30 },
        { exerciseId: "plank", sets: 2, seconds: secs(30), restSec: 0 },
      ],
    },
  ];
  const t = templates[(day - 1) % templates.length];
  const focus = day === 30 ? "Final test — longest plank hold" : t.focus;
  return challengeDay(day, focus, t.blocks);
}

function buildFullBodyDay(day: number): ChallengeDay {
  const week = Math.min(4, Math.floor((day - 1) / 7)); // 0..4
  const reps = (b: number) => Math.min(30, b + week * 2);
  const secs = (b: number) => Math.min(60, b + week * 5);
  const templates: { focus: string; blocks: WorkoutBlock[] }[] = [
    {
      focus: "Push + legs",
      blocks: [
        { exerciseId: "pushup", sets: 3, reps: reps(8), restSec: 30 },
        { exerciseId: "squat", sets: 3, reps: reps(10), restSec: 30 },
        { exerciseId: "plank", sets: 3, seconds: secs(20), restSec: 0 },
      ],
    },
    {
      focus: "Core + engine",
      blocks: [
        { exerciseId: "mountain-climber", sets: 3, seconds: secs(20), restSec: 30 },
        { exerciseId: "glute-bridge", sets: 3, reps: reps(10), restSec: 30 },
        { exerciseId: "bicycle", sets: 3, reps: reps(10), restSec: 0 },
      ],
    },
    {
      focus: "Total body",
      blocks: [
        { exerciseId: "squat", sets: 3, reps: reps(10), restSec: 30 },
        { exerciseId: "pushup", sets: 3, reps: reps(8), restSec: 30 },
        { exerciseId: "superman", sets: 2, reps: reps(8), restSec: 30 },
        { exerciseId: "jumping-jack", sets: 2, seconds: secs(30), restSec: 0 },
      ],
    },
  ];
  const t = templates[(day - 1) % templates.length];
  const focus = day === 30 ? "Final test — everything you've got" : t.focus;
  return challengeDay(day, focus, t.blocks);
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "abs-30",
    name: "30-Day Abs",
    tagline: "A stronger core in ~10 minutes a day.",
    buildDay: buildAbsDay,
  },
  {
    id: "fullbody-30",
    name: "30-Day Full Body",
    tagline: "Head-to-toe strength, no equipment needed.",
    buildDay: buildFullBodyDay,
  },
];

export const challengeById = new Map(CHALLENGES.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Warm-up (before) and cool-down (after) routines, auto-attached to sessions.
// ---------------------------------------------------------------------------

export const WARMUP_ROUTINE: WorkoutBlock[] = [
  { exerciseId: "jumping-jack", sets: 1, seconds: 30, restSec: 10 },
  { exerciseId: "arm-circles", sets: 1, seconds: 30, restSec: 10 },
  { exerciseId: "leg-swings", sets: 1, seconds: 30, restSec: 10 },
  { exerciseId: "squat", sets: 1, seconds: 30, restSec: 10 },
  { exerciseId: "neck-rolls", sets: 1, seconds: 30, restSec: 0 },
];

export const COOLDOWN_ROUTINE: WorkoutBlock[] = [
  { exerciseId: "standing-quad-stretch", sets: 1, seconds: 30, restSec: 10 },
  { exerciseId: "standing-toe-touch", sets: 1, seconds: 30, restSec: 10 },
  { exerciseId: "childs-pose", sets: 1, seconds: 45, restSec: 10 },
  { exerciseId: "neck-rolls", sets: 1, seconds: 30, restSec: 0 },
];

/** Prepend WARMUP_ROUTINE and append COOLDOWN_ROUTINE, tagging each block
 *  with its segment. Both default to true; pass false to skip. */
export function withWarmupCooldown(
  blocks: WorkoutBlock[],
  opts: { warmup?: boolean; cooldown?: boolean } = {},
): (WorkoutBlock & { segment: Segment })[] {
  const out: (WorkoutBlock & { segment: Segment })[] = [];
  if (opts.warmup !== false) {
    for (const b of WARMUP_ROUTINE) out.push({ ...b, segment: "warmup" });
  }
  for (const b of blocks) out.push({ ...b, segment: "main" });
  if (opts.cooldown !== false) {
    for (const b of COOLDOWN_ROUTINE) out.push({ ...b, segment: "cooldown" });
  }
  return out;
}
