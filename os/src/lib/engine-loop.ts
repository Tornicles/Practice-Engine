import { AVATAR_STAGES } from "./types";
import type {
  AvatarStage,
  FitnessState,
  Nudge,
  RunWorkout,
  WorkoutPlan,
} from "./types";
import { uid } from "./utils";

export function stageForXp(xp: number): AvatarStage {
  let stage: AvatarStage = "spark";
  for (const s of AVATAR_STAGES) if (xp >= s.xp) stage = s.id;
  return stage;
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function activeDays(state: FitnessState): string[] {
  const days = new Set<string>();
  for (const s of state.workoutSessions) days.add(dayKey(s.date));
  for (const s of state.runSessions) days.add(dayKey(s.date));
  return [...days].sort().reverse();
}

/** Consecutive active days ending today or yesterday. */
export function streakDays(state: FitnessState, today = new Date()): number {
  const days = new Set(activeDays(state));
  let streak = 0;
  const cursor = new Date(today);
  // Allow the streak to be "alive" if yesterday was active but today isn't yet.
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!days.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function daysSinceLastActivity(state: FitnessState, today = new Date()): number | null {
  const days = activeDays(state);
  if (!days.length) return null;
  const last = new Date(`${days[0]}T12:00:00Z`).getTime();
  const now = new Date(today.toISOString().slice(0, 10) + "T12:00:00Z").getTime();
  return Math.max(0, Math.round((now - last) / 86_400_000));
}

export interface DaySchedule {
  weekday: number; // 0 = Sunday
  strengthDue: boolean;
  runDue?: RunWorkout;
  restSuggested: boolean;
  restReason?: string;
  activePlan?: WorkoutPlan;
}

/** Strength rhythm Mon/Wed/Fri; runs from the active run plan; rest logic from last rating. */
export function todaysSchedule(state: FitnessState, today = new Date()): DaySchedule {
  const weekday = today.getUTCDay();
  const activePlan = state.workoutPlans.find((p) => p.id === state.activePlanId && p.status === "active");
  const activeRun = state.runPlans.find((p) => p.id === state.activeRunPlanId && p.status === "active");

  const lastWorkout = [...state.workoutSessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastWasYesterday =
    lastWorkout != null &&
    dayKey(lastWorkout.date) === new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  const lastWasHard = lastWorkout?.difficulty === "too_hard";

  let runDue: RunWorkout | undefined;
  if (activeRun) {
    const week = activeRun.weeks[Math.min(activeRun.currentWeek - 1, activeRun.weeks.length - 1)] ?? [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    runDue = week.find((w) => w.day === dayNames[weekday]);
  }

  const strengthDue = [1, 3, 5].includes(weekday) && activePlan != null;
  const restSuggested = Boolean(lastWasYesterday && lastWasHard);
  const restReason = restSuggested
    ? "Yesterday was rated too hard — a light day protects tomorrow's session."
    : undefined;

  return { weekday, strengthDue: strengthDue && !restSuggested, runDue, restSuggested, restReason, activePlan };
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
  const streak = streakDays(state, today);

  if (!done && (sched.strengthDue || sched.runDue)) {
    const what = sched.strengthDue ? sched.activePlan?.title ?? "strength session" : sched.runDue?.title ?? "run";
    nudges.push({
      kind: "reminder",
      text: `Today's training: ${what}. Open the adapt gate if time or energy is short — a short session beats a skipped one.`,
      href: sched.strengthDue ? "/train" : "/run",
    });
  }
  if (sched.restSuggested && sched.restReason) {
    nudges.push({ kind: "rest", text: sched.restReason, href: "/train" });
  }
  if (idle != null && idle >= 3) {
    nudges.push({
      kind: "cold",
      text: `It's been ${idle} days since your last session. Streaks forgive — do 10 minutes today to restart the engine.`,
      href: "/train",
    });
  }
  if (streak > 0 && streak % 7 === 0) {
    nudges.push({
      kind: "streak",
      text: `${streak}-day streak. That's the habit compounding — keep the chain unbroken.`,
      href: "/progress",
    });
  }
  const hasMealPlanToday = state.mealPlans.some(
    (m) => dayKey(m.date) === today.toISOString().slice(0, 10),
  );
  if (!hasMealPlanToday && state.groceryScans.length > 0) {
    nudges.push({
      kind: "fuel",
      text: "No meals planned for today. Your last grocery scan can become today's menu in one tap.",
      href: "/fuel",
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
export function weeklyVolume(state: FitnessState, weeks = 8): { label: string; workouts: number; runs: number; km: number }[] {
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
