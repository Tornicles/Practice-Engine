import { AVATAR_STAGES } from "./types";
import type {
  AvatarStage,
  DietKind,
  DifficultyRating,
  FitnessState,
  Ingredient,
  Meal,
  Nudge,
  OccupationProfile,
  RunWorkout,
  StreakLives,
  UserProfile,
  WorkoutPlan,
  WorkType,
} from "./types";
import { dayKey, uid } from "./format";

export function stageForXp(xp: number): AvatarStage {
  let stage: AvatarStage = "spark";
  for (const s of AVATAR_STAGES) if (xp >= s.xp) stage = s.id;
  return stage;
}

export function xpForNextStage(xp: number): number | null {
  for (const s of AVATAR_STAGES) if (xp < s.xp) return s.xp;
  return null;
}

function activeDays(state: FitnessState): string[] {
  const days = new Set<string>();
  for (const s of state.workoutSessions) days.add(dayKey(s.date));
  for (const s of state.runSessions) days.add(dayKey(s.date));
  return [...days].sort().reverse();
}

/** Raw consecutive active days ending today or yesterday (no forgiveness). */
export function rawStreakDays(state: FitnessState, today = new Date()): number {
  const days = new Set(activeDays(state));
  let streak = 0;
  const cursor = new Date(today);
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!days.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function currentMonth(today = new Date()) {
  return today.toISOString().slice(0, 7);
}

/** Seven-style forgiveness: missed days consume a life instead of breaking the streak. */
export function effectiveStreak(
  state: FitnessState,
  today = new Date(),
): { streak: number; lives: StreakLives; broken: boolean } {
  const month = currentMonth(today);
  let lives: StreakLives =
    state.lives.month === month ? { ...state.lives } : { month, left: 3 };
  const days = new Set(activeDays(state));
  let streak = 0;
  let broken = false;
  const cursor = new Date(today);
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!days.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    // Gap day: spend a life if the streak is alive, else the streak is broken.
    if (streak > 0 && lives.left > 0) {
      lives = { ...lives, left: lives.left - 1 };
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    if (streak > 0) broken = true;
    break;
  }
  return { streak, lives, broken };
}

export function daysSinceLastActivity(state: FitnessState, today = new Date()): number | null {
  const days = activeDays(state);
  if (!days.length) return null;
  const last = new Date(`${days[0]}T12:00:00Z`).getTime();
  const now = new Date(today.toISOString().slice(0, 10) + "T12:00:00Z").getTime();
  return Math.max(0, Math.round((now - last) / 86_400_000));
}

export interface DaySchedule {
  weekday: number;
  strengthDue: boolean;
  runDue?: RunWorkout;
  restSuggested: boolean;
  restReason?: string;
  activePlan?: WorkoutPlan;
}

/** Strength rhythm Mon/Wed/Fri; runs from the active run plan; rest logic from last rating. */
export function todaysSchedule(state: FitnessState, today = new Date()): DaySchedule {
  const weekday = today.getUTCDay();
  const activePlan = state.workoutPlans.find(
    (p) => p.id === state.activePlanId && p.status === "active",
  );
  const activeRun = state.runPlans.find(
    (p) => p.id === state.activeRunPlanId && p.status === "active",
  );

  const lastWorkout = [...state.workoutSessions].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  const lastWasYesterday =
    lastWorkout != null &&
    dayKey(lastWorkout.date) ===
      new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  const lastWasHard = lastWorkout?.difficulty === "too_hard";

  let runDue: RunWorkout | undefined;
  if (activeRun) {
    const week =
      activeRun.weeks[Math.min(activeRun.currentWeek - 1, activeRun.weeks.length - 1)] ?? [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    runDue = week.find((w) => w.day === dayNames[weekday]);
  }

  const strengthDue = [1, 3, 5].includes(weekday) && activePlan != null;
  const restSuggested = Boolean(lastWasYesterday && lastWasHard);
  const restReason = restSuggested
    ? "Yesterday was rated too hard — a light day protects tomorrow's session."
    : undefined;

  return {
    weekday,
    strengthDue: strengthDue && !restSuggested,
    runDue,
    restSuggested,
    restReason,
    activePlan,
  };
}

function loggedToday(state: FitnessState, today = new Date()): boolean {
  const key = today.toISOString().slice(0, 10);
  return (
    state.workoutSessions.some((s) => dayKey(s.date) === key) ||
    state.runSessions.some((s) => dayKey(s.date) === key)
  );
}

/** Daily nudges: reminders, going-cold re-engagement, rest guidance, streak milestones. */
export function generateNudges(state: FitnessState, today = new Date()): Nudge[] {
  const nudges: Omit<Nudge, "id" | "createdAt">[] = [];
  const sched = todaysSchedule(state, today);
  const done = loggedToday(state, today);
  const idle = daysSinceLastActivity(state, today);
  const { streak } = effectiveStreak(state, today);

  if (!done && (sched.strengthDue || sched.runDue)) {
    const what = sched.strengthDue
      ? (sched.activePlan?.title ?? "strength session")
      : (sched.runDue?.title ?? "run");
    nudges.push({
      kind: "reminder",
      text: `Today's training: ${what}. Open the adapt gate if time or energy is short — a short session beats a skipped one.`,
      tab: sched.strengthDue ? "train" : "run",
    });
  }
  if (sched.restSuggested && sched.restReason) {
    nudges.push({ kind: "rest", text: sched.restReason, tab: "train" });
  }
  if (idle != null && idle >= 3) {
    nudges.push({
      kind: "cold",
      text: `It's been ${idle} days since your last session. Streaks forgive — do 10 minutes today to restart the engine.`,
      tab: "train",
    });
  }
  if (streak > 0 && streak % 7 === 0) {
    nudges.push({
      kind: "streak",
      text: `${streak}-day streak. That's the habit compounding — keep the chain unbroken.`,
      tab: "progress",
    });
  }
  const hasMealPlanToday = state.mealPlans.some(
    (m) => dayKey(m.date) === today.toISOString().slice(0, 10),
  );
  if (!hasMealPlanToday && state.groceryScans.length > 0) {
    nudges.push({
      kind: "fuel",
      text: "No meals planned for today. Your last grocery scan can become today's menu in one tap.",
      tab: "fuel",
    });
  }
  return nudges.map((n) => ({ ...n, id: uid("ng"), createdAt: new Date().toISOString() }));
}

/** 0–100 readiness: recent difficulty ratings + occupation load. */
export function readiness(state: FitnessState): number {
  const recent = [...state.workoutSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  let score = 70;
  for (const s of recent) {
    if (s.difficulty === "too_hard") score -= 6;
    if (s.difficulty === "too_easy") score += 4;
  }
  if (state.occupation.workType === "physical") score -= 10;
  if (state.occupation.workType === "shift") score -= 5;
  if (state.occupation.hoursPerDay >= 10) score -= 5;
  return Math.max(5, Math.min(100, score));
}

/** Weekly volume for progress charts. */
export function weeklyVolume(
  state: FitnessState,
  weeks = 8,
): { label: string; workouts: number; runs: number; km: number }[] {
  const out: { label: string; workouts: number; runs: number; km: number }[] = [];
  const now = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - w * 7 - 6);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    const inWeek = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };
    const workouts = state.workoutSessions.filter((s) => inWeek(s.date)).length;
    const runs = state.runSessions.filter((s) => inWeek(s.date));
    out.push({
      label: `${start.toISOString().slice(5, 10)}`,
      workouts,
      runs: runs.length,
      km: Math.round(runs.reduce((n, r) => n + r.distanceKm, 0) * 10) / 10,
    });
  }
  return out;
}

/** Difficulty rating distribution for the Progress tab. */
export function ratingDistribution(state: FitnessState): Record<DifficultyRating, number> {
  const out: Record<DifficultyRating, number> = { too_easy: 0, just_right: 0, too_hard: 0 };
  for (const s of state.workoutSessions) if (s.difficulty) out[s.difficulty] += 1;
  return out;
}

/** Last-28-days activity dots for the streak calendar. */
export function activityCalendar(state: FitnessState, today = new Date()): { date: string; active: boolean }[] {
  const days = new Set(activeDays(state));
  const out: { date: string; active: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, active: days.has(key) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Occupation-aware programming
// ---------------------------------------------------------------------------

const ACTIVITY_MULTIPLIER: Record<WorkType, number> = {
  sedentary: 1.2,
  standing: 1.375,
  physical: 1.725,
  shift: 1.3,
};

/** Mifflin-St Jeor BMR × occupation activity multiplier, adjusted for goal. */
export function calorieTarget(profile: UserProfile, occ: OccupationProfile): number {
  const s = profile.sex === "female" ? -161 : 5;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;
  let tdee = bmr * ACTIVITY_MULTIPLIER[occ.workType];
  if (occ.hoursPerDay >= 10) tdee *= 1.05;
  if (profile.goal === "lose") tdee -= 400;
  if (profile.goal === "build") tdee += 200;
  return Math.round(tdee / 50) * 50;
}

export function proteinTarget(profile: UserProfile): number {
  const perKg = profile.goal === "build" ? 2.0 : 1.6;
  return Math.round(profile.weightKg * perKg);
}

export function occupationAdaptation(occ: OccupationProfile): string {
  switch (occ.workType) {
    case "physical":
      return "Physical job detected: sessions capped at 25 min, low-impact bias, and no heavy leg day after long shifts. Recovery is the program.";
    case "shift":
      return "Shift work detected: flexible scheduling — train on days off or before early shifts, never after a night shift. Keep a 15-min backup session.";
    case "standing":
      return "On your feet all day: extra calf/foot recovery, low-impact cardio preferred, and upper-body emphasis on work days.";
    default:
      return "Desk work detected: movement snacks between sessions, hip-openers in warm-up, and posture-focused core work.";
  }
}

/** Freeletics-style adaptation: post-session rating retunes the next session. */
export function adaptationForRating(
  rating: DifficultyRating,
): { note: string; levelDelta: -1 | 0 | 1; swapLowImpact: boolean } {
  switch (rating) {
    case "too_easy":
      return {
        note: "Rated too easy — next session steps up: harder progressions, +1 set on main lifts.",
        levelDelta: 1,
        swapLowImpact: false,
      };
    case "too_hard":
      return {
        note: "Rated too hard — next session eases off: regressions swapped in, low-impact bias, shorter blocks.",
        levelDelta: -1,
        swapLowImpact: true,
      };
    default:
      return {
        note: "Rated just right — holding the line. Small volume bump next week.",
        levelDelta: 0,
        swapLowImpact: false,
      };
  }
}

export function xpForWorkout(minutes: number): number {
  return Math.min(40, 15 + Math.round(minutes / 2));
}
export function xpForRun(km: number): number {
  return Math.min(40, 10 + Math.round(km * 4));
}
export const XP_MEAL_DAY = 10;
export const XP_RATING_BONUS = 5;

// ---------------------------------------------------------------------------
// Template meals (used when AI is unavailable; always labeled "template").
// ---------------------------------------------------------------------------

export function templateMealsFromIngredients(
  ingredients: string[],
  diet: DietKind,
): Meal[] {
  const list = ingredients.slice(0, 12);
  const protein =
    list.find((i) =>
      /chicken|beef|pork|fish|salmon|tuna|turkey|egg|tofu|lentil|bean|yogurt/i.test(i),
    ) ?? "protein of choice";
  const veg = list.filter((i) =>
    /broccoli|spinach|pepper|carrot|zucchini|kale|lettuce|tomato|onion|cucumber|mushroom/i.test(i),
  );
  const carb =
    list.find((i) => /rice|pasta|oat|potato|bread|quinoa|tortilla|noodle/i.test(i)) ??
    "grain of choice";
  const vegList = veg.length ? veg.slice(0, 3).join(", ") : "mixed vegetables";
  const dietNote =
    diet === "vegan" ? " (plant-based)" : diet === "vegetarian" ? " (vegetarian)" : "";
  return [
    {
      name: `Power breakfast bowl${dietNote}`,
      ingredients: ["oats or eggs", "fruit", "nuts"],
      prepMin: 10,
      tags: ["breakfast", "template"],
    },
    {
      name: `One-pan ${protein} + ${carb}`,
      ingredients: [protein, carb, vegList],
      prepMin: 25,
      tags: ["lunch", "template"],
    },
    {
      name: `Big plate: ${vegList} + ${protein}`,
      ingredients: [vegList, protein, "olive oil", "spices"],
      prepMin: 20,
      tags: ["dinner", "template"],
    },
  ];
}

/** Canned "vision guess" sets for grocery photos when no AI key is set. */
export const TEMPLATE_GROCERY_GUESSES: { label: string; ingredients: Ingredient[] }[] = [
  {
    label: "Weekly haul guess",
    ingredients: [
      { name: "chicken breast", qty: "1 kg" },
      { name: "brown rice", qty: "1 bag" },
      { name: "broccoli", qty: "2 heads" },
      { name: "eggs", qty: "12" },
      { name: "oats", qty: "1 bag" },
      { name: "spinach", qty: "200 g" },
      { name: "greek yogurt", qty: "500 g" },
      { name: "olive oil", qty: "1 bottle" },
    ],
  },
  {
    label: "Veggie haul guess",
    ingredients: [
      { name: "tofu", qty: "400 g" },
      { name: "quinoa", qty: "1 bag" },
      { name: "kale", qty: "1 bunch" },
      { name: "sweet potatoes", qty: "1 kg" },
      { name: "chickpeas", qty: "2 cans" },
      { name: "avocado", qty: "3" },
      { name: "olive oil", qty: "1 bottle" },
    ],
  },
];
