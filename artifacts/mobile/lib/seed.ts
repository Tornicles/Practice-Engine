import { daysAgo } from "./format";
import { templateRunPlan } from "./ai";
import { buildTemplateSession } from "./exercises";
import type { FitnessState, WorkoutBlock } from "./types";

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function withId<T extends object>(obj: T, id: string): T & { id: string } {
  return { ...obj, id };
}

function toBlocks(
  built: ReturnType<typeof buildTemplateSession>,
): WorkoutBlock[] {
  return built.blocks.map((b) => ({ ...b, restSec: b.restSec }));
}

export function createSeed(): FitnessState {
  const full = buildTemplateSession({
    focus: "full",
    minutes: 30,
    equipment: { bodyweight: true, dumbbells: true, bands: true, chair: true, pullupBar: false, kettlebell: false },
    level: 1,
  });
  const upper = buildTemplateSession({
    focus: "upper",
    minutes: 20,
    equipment: { bodyweight: true, dumbbells: true, bands: true, chair: true, pullupBar: false, kettlebell: false },
    level: 2,
  });
  const runTpl = templateRunPlan("5k");

  return {
    hydrated: false,
    onboarded: true,
    profile: {
      name: "Alex Rivera",
      age: 29,
      sex: "male",
      heightCm: 178,
      weightKg: 86,
      goal: "lose",
      goalDetail: "Lose 8 kg and run a 5K without stopping.",
      fitnessLevel: "beginner",
      injuries: "Mild right-knee ache on deep squats — low-impact preferred.",
      avatar: { skin: "#c98d64", color: "#ff6b35", style: "bolt" },
    },
    occupation: {
      workType: "sedentary",
      label: "Software engineer (WFH)",
      hoursPerDay: 9,
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      preferredTrainingTime: "morning",
      shiftWork: false,
      shiftNotes: "Work from home, software engineer. Sits 9h+ on heavy days.",
    },
    equipment: {
      bodyweight: true,
      dumbbells: true,
      bands: true,
      chair: true,
      pullupBar: false,
      kettlebell: false,
    },
    dietary: {
      diet: "omnivore",
      allergies: [],
      dislikes: ["mushrooms"],
      calorieTarget: 2200,
      proteinTargetG: 140,
    },
    workoutPlans: [
      {
        ...withId(
          {
            title: "Forge Full-Body · 30 min",
            focus: "Full body",
            minutes: 30,
            level: "beginner" as const,
            blocks: toBlocks(full),
            status: "active" as const,
            source: "template" as const,
            createdAt: daysAgo(20),
            adaptedNote:
              "Desk work detected: movement snacks between sessions, hip-openers in warm-up, and posture-focused core work.",
          },
          "wp-active",
        ),
      },
      {
        ...withId(
          {
            title: "Upper Body Push · 20 min",
            focus: "Upper body",
            minutes: 20,
            level: "intermediate" as const,
            blocks: toBlocks(upper),
            status: "draft" as const,
            source: "ai" as const,
            createdAt: daysAgo(4),
          },
          "wp-draft",
        ),
      },
    ],
    activePlanId: "wp-active",
    workoutSessions: [
      { id: "ws-9", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(1, 18), minutes: 30, blocksDone: 6, blocksTotal: 6, difficulty: "just_right", notes: "Felt strong. Push-ups getting easier." },
      { id: "ws-8", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(3, 18), minutes: 28, blocksDone: 6, blocksTotal: 6, difficulty: "too_hard", notes: "Skipped the last rest — legs were gone." },
      { id: "ws-7", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(5, 18), minutes: 30, blocksDone: 6, blocksTotal: 6, difficulty: "just_right" },
      { id: "ws-6", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(8, 18), minutes: 26, blocksDone: 5, blocksTotal: 6, difficulty: "just_right", notes: "Cut one set — knee felt off." },
      { id: "ws-5", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(10, 18), minutes: 30, blocksDone: 6, blocksTotal: 6, difficulty: "too_easy", notes: "Time to level up the push-ups." },
      { id: "ws-4", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(12, 18), minutes: 30, blocksDone: 6, blocksTotal: 6, difficulty: "just_right" },
      { id: "ws-3", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(15, 18), minutes: 24, blocksDone: 5, blocksTotal: 6, difficulty: "just_right" },
      { id: "ws-2", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(17, 18), minutes: 30, blocksDone: 6, blocksTotal: 6, difficulty: "too_hard", notes: "First week back — humbling." },
      { id: "ws-1", planId: "wp-active", title: "Forge Full-Body · 30 min", date: daysAgo(19, 18), minutes: 22, blocksDone: 4, blocksTotal: 6, difficulty: "too_hard" },
    ],
    groceryScans: [
      {
        id: "gs-2",
        scannedAt: daysAgo(2, 11),
        visionUsed: true,
        note: "Weekly haul",
        ingredients: [
          { name: "chicken breast", qty: "1 kg" },
          { name: "brown rice", qty: "1 bag" },
          { name: "broccoli", qty: "2 heads" },
          { name: "eggs", qty: "12" },
          { name: "oats", qty: "1 bag" },
          { name: "spinach", qty: "200 g" },
          { name: "greek yogurt", qty: "500 g" },
          { name: "olive oil", qty: "1 bottle" },
          { name: "cherry tomatoes", qty: "1 box" },
          { name: "red onions", qty: "3" },
        ],
      },
      {
        id: "gs-1",
        scannedAt: daysAgo(9, 11),
        visionUsed: false,
        note: "Typed in manually",
        ingredients: [
          { name: "salmon fillets", qty: "4" },
          { name: "sweet potatoes", qty: "1 kg" },
          { name: "kale", qty: "1 bunch" },
          { name: "eggs", qty: "12" },
        ],
      },
    ],
    mealPlans: [
      {
        id: "mp-2",
        date: daysAgo(2),
        source: "vision",
        groceryScanId: "gs-2",
        meals: [
          { name: "Greek yogurt + oats + berries", ingredients: ["greek yogurt", "oats", "honey"], prepMin: 5, calories: 420, proteinG: 28, tags: ["breakfast"] },
          { name: "Chicken rice bowls", ingredients: ["chicken breast", "brown rice", "broccoli", "olive oil"], prepMin: 25, calories: 640, proteinG: 48, tags: ["lunch"] },
          { name: "Spinach + egg scramble with tomatoes", ingredients: ["eggs", "spinach", "cherry tomatoes", "red onions"], prepMin: 15, calories: 480, proteinG: 32, tags: ["dinner"] },
        ],
      },
      {
        id: "mp-1",
        date: daysAgo(9),
        source: "template",
        groceryScanId: "gs-1",
        meals: [
          { name: "Veggie omelette", ingredients: ["eggs", "kale", "olive oil"], prepMin: 10, tags: ["breakfast", "template"] },
          { name: "Salmon + sweet potato", ingredients: ["salmon fillets", "sweet potatoes", "kale"], prepMin: 30, tags: ["dinner", "template"] },
        ],
      },
    ],
    runPlans: [
      { ...withId({ ...runTpl, goal: "5k" as const, currentWeek: 3, status: "active" as const, source: "template" as const, createdAt: daysAgo(20) }, "rp-active") },
    ],
    activeRunPlanId: "rp-active",
    runSessions: [
      { id: "rs-8", date: daysAgo(2, 7), distanceKm: 4.0, durationMin: 36, effort: 3, planRef: "Week 3 · Long run", notes: "First 4K. Walked 2 min in the middle." },
      { id: "rs-7", date: daysAgo(4, 7), distanceKm: 3.5, durationMin: 33, effort: 3, planRef: "Week 3 · Easy run" },
      { id: "rs-6", date: daysAgo(6, 7), distanceKm: 3.2, durationMin: 31, effort: 2, planRef: "Week 2 · Walk/run intervals" },
      { id: "rs-5", date: daysAgo(9, 7), distanceKm: 3.0, durationMin: 30, effort: 3, planRef: "Week 2 · Long run" },
      { id: "rs-4", date: daysAgo(11, 7), distanceKm: 2.8, durationMin: 28, effort: 2, planRef: "Week 2 · Easy run" },
      { id: "rs-3", date: daysAgo(14, 7), distanceKm: 2.4, durationMin: 25, effort: 3, planRef: "Week 1 · Walk/run intervals" },
      { id: "rs-2", date: daysAgo(16, 7), distanceKm: 2.0, durationMin: 22, effort: 2, planRef: "Week 1 · Easy run" },
      { id: "rs-1", date: daysAgo(18, 7), distanceKm: 1.6, durationMin: 18, effort: 3, planRef: "Week 1 · Walk/run intervals", notes: "Day one. Breathing was the workout." },
    ],
    avatar: { xp: 215, stage: "ember" },
    lives: { month: new Date().toISOString().slice(0, 7), left: 3 },
    nudges: [],
    drafts: [],
    chat: [
      {
        id: "ch-1",
        role: "coach",
        text: "Welcome to Forge, Alex. I'm your AI trainer — I suggest, you decide. Your full-body plan is active and week 3 of Couch to 5K is underway. What's on your mind?",
        at: daysAgo(1, 9),
        source: "template",
      },
    ],
    events: [
      { id: "ev-3", type: "RUN_LOGGED", entityType: "runSession", entityId: "rs-8", at: daysAgo(2, 8) },
      { id: "ev-2", type: "WORKOUT_LOGGED", entityType: "workoutSession", entityId: "ws-9", at: daysAgo(1, 19) },
      { id: "ev-1", type: "PLAN_ACTIVATED", entityType: "workoutPlan", entityId: "wp-active", at: daysAgo(20, 9) },
    ],
    pbs: {
      "ember-circuit": [{ seconds: 754, date: daysAgo(12, 18) }],
    },
    challenge: null,
    todayStamp: todayStamp(),
    settings: { units: "metric", reminders: true, reminderHour: 7, reminderMinute: 0, coachPersona: "steady" },
  };
}
