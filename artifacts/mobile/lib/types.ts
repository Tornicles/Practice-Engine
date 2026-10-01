// Forge — AI personal trainer domain types (mobile).
// AI suggests, you decide: every AI-generated plan starts as a draft.

export type EquipmentKey =
  | "bodyweight"
  | "dumbbells"
  | "bands"
  | "chair"
  | "pullupBar"
  | "kettlebell";

export type Equipment = Record<EquipmentKey, boolean>;

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  bodyweight: "Bodyweight",
  dumbbells: "Dumbbells",
  bands: "Resistance bands",
  chair: "Chair / bench",
  pullupBar: "Pull-up bar",
  kettlebell: "Kettlebell",
};

export type WorkType = "sedentary" | "standing" | "physical" | "shift";

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  sedentary: "Desk / sedentary",
  standing: "Standing / retail / hospitality",
  physical: "Physical labor",
  shift: "Shift work / nights",
};

export interface OccupationProfile {
  workType: WorkType;
  label: string;
  hoursPerDay: number;
  workDays: string[];
  preferredTrainingTime: "morning" | "lunch" | "evening";
  shiftWork: boolean;
  shiftNotes: string;
}

export type DietKind = "omnivore" | "vegetarian" | "vegan" | "halal" | "kosher";

export const DIET_LABELS: Record<DietKind, string> = {
  omnivore: "Omnivore",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  halal: "Halal",
  kosher: "Kosher",
};

export interface DietaryPrefs {
  diet: DietKind;
  allergies: string[];
  dislikes: string[];
  calorieTarget?: number;
  proteinTargetG?: number;
}

export type FitnessGoal = "lose" | "build" | "endurance" | "habit";

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose: "Lose weight",
  build: "Build strength",
  endurance: "Run farther",
  habit: "Build the habit",
};

export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type Sex = "male" | "female" | "other";
export type AvatarStyle = "spark" | "bolt" | "wave";

export interface AvatarSpec {
  skin: string;
  color: string;
  style: AvatarStyle;
}

export interface UserProfile {
  name: string;
  age: number;
  sex?: Sex;
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  goalDetail: string;
  fitnessLevel: FitnessLevel;
  injuries: string;
  avatar: AvatarSpec;
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "glutes"
  | "legs"
  | "full";

export type MovementPattern = "push" | "pull" | "squat" | "hinge" | "core" | "cardio";

/** Leap-style grouping: which muscle-program an exercise belongs to. */
export type ExerciseGroup = "chest" | "abs" | "legs" | "arms" | "butt" | "fullbody";

export interface Exercise {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  pattern: MovementPattern;
  equipment: EquipmentKey[];
  level: 1 | 2 | 3;
  impact: "low" | "high";
  cues: string[];
  regressTo?: string;
  progressTo?: string;
  /** Movement archetype key consumed by <ExerciseAnimation /> (e.g. "squat"). */
  anim: string;
  /** Primary muscle-group program this exercise belongs to. */
  group: ExerciseGroup;
}

/** Segment of a session: warm-up / main work / cool-down. */
export type Segment = "warmup" | "main" | "cooldown";

export interface MuscleProgram {
  id: string;
  name: string;
  tagline: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  blocks: WorkoutBlock[];
}

export interface ChallengeDay {
  day: number;
  focus: string;
  rest: boolean;
  blocks: WorkoutBlock[];
}

export interface ChallengeDef {
  id: string;
  name: string;
  tagline: string;
  /** Returns the plan for day 1..30 (rest days have rest: true and no blocks). */
  buildDay: (day: number) => ChallengeDay;
}

export interface ChallengeProgress {
  challengeId: string;
  /** Next day to do (1-based). > 30 means the challenge is complete. */
  day: number;
  /** Work days completed (rest-day skips are not recorded here). */
  completedDays: number[];
  startedAt: string;
}

export interface WorkoutBlock {
  exerciseId: string;
  sets: number;
  reps?: number;
  seconds?: number;
  restSec: number;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  focus: string;
  minutes: number;
  level: FitnessLevel;
  blocks: WorkoutBlock[];
  status: "draft" | "active" | "archived";
  source: "ai" | "template" | "manual";
  createdAt: string;
  adaptedNote?: string;
  isBenchmark?: boolean;
}

export type DifficultyRating = "too_easy" | "just_right" | "too_hard";

export const DIFFICULTY_LABELS: Record<DifficultyRating, string> = {
  too_easy: "Too easy",
  just_right: "Just right",
  too_hard: "Too hard",
};

export interface WorkoutSession {
  id: string;
  planId?: string;
  title: string;
  date: string;
  minutes: number;
  blocksDone: number;
  blocksTotal: number;
  difficulty?: DifficultyRating;
  notes?: string;
  benchmarkId?: string;
  benchmarkSec?: number;
}

export interface Ingredient {
  name: string;
  qty?: string;
}

export interface GroceryScan {
  id: string;
  scannedAt: string;
  ingredients: Ingredient[];
  note?: string;
  visionUsed: boolean;
  photoUri?: string;
}

export interface Meal {
  name: string;
  ingredients: string[];
  prepMin: number;
  calories?: number;
  proteinG?: number;
  tags: string[];
}

export interface MealPlan {
  id: string;
  date: string;
  meals: Meal[];
  source: "ai" | "vision" | "template" | "manual";
  groceryScanId?: string;
}

export type RunWorkoutType = "walk_run" | "easy" | "intervals" | "tempo" | "long";

export const RUN_TYPE_LABELS: Record<RunWorkoutType, string> = {
  walk_run: "Walk / run",
  easy: "Easy run",
  intervals: "Intervals",
  tempo: "Tempo",
  long: "Long run",
};

export interface RunWorkout {
  week: number;
  day: string;
  type: RunWorkoutType;
  title: string;
  detail: string;
  targetKm?: number;
  targetMin?: number;
}

export interface RunPlan {
  id: string;
  title: string;
  goal: "5k" | "10k" | "habit";
  weeks: RunWorkout[][];
  currentWeek: number;
  status: "draft" | "active" | "done";
  source: "ai" | "template";
  createdAt: string;
}

export interface RunSession {
  id: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  effort?: 1 | 2 | 3 | 4 | 5;
  planRef?: string;
  notes?: string;
}

export type AvatarStage = "spark" | "ember" | "forge" | "titan";

export const AVATAR_STAGES: { id: AvatarStage; label: string; xp: number }[] = [
  { id: "spark", label: "Spark", xp: 0 },
  { id: "ember", label: "Ember", xp: 100 },
  { id: "forge", label: "Forge", xp: 300 },
  { id: "titan", label: "Titan", xp: 600 },
];

export interface AvatarState {
  xp: number;
  stage: AvatarStage;
}

/** Seven-style streak forgiveness: 3 lives per calendar month. */
export interface StreakLives {
  month: string; // "2026-09"
  left: number;
}

export interface Nudge {
  id: string;
  kind: "reminder" | "cold" | "rest" | "streak" | "fuel";
  text: string;
  tab: "today" | "train" | "fuel" | "run" | "progress" | "coach" | "profile";
  createdAt: string;
  dismissed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  at: string;
  source: "ai" | "template";
}

/** A draft awaiting "AI suggests, you decide" review. */
export interface Draft {
  id: string;
  kind: "workout" | "meals" | "run";
  title: string;
  summary: string;
  payload: unknown;
  source: "ai" | "template";
  createdAt: string;
}

export interface FitnessEvent {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  at: string;
}

export interface AppSettings {
  units: "metric" | "imperial";
  reminders: boolean;
  reminderHour: number;
  reminderMinute: number;
  coachPersona: "steady" | "drill" | "cheer";
}

export const PERSONA_LABELS: Record<AppSettings["coachPersona"], string> = {
  steady: "Steady",
  drill: "Drill sergeant",
  cheer: "Cheerleader",
};

export interface PBEntry {
  seconds: number;
  date: string;
}

export interface FitnessState {
  hydrated: boolean;
  onboarded: boolean;
  profile: UserProfile;
  occupation: OccupationProfile;
  equipment: Equipment;
  dietary: DietaryPrefs;
  workoutPlans: WorkoutPlan[];
  activePlanId?: string;
  workoutSessions: WorkoutSession[];
  groceryScans: GroceryScan[];
  mealPlans: MealPlan[];
  runPlans: RunPlan[];
  activeRunPlanId?: string;
  runSessions: RunSession[];
  avatar: AvatarState;
  avatarPhotoUri?: string;
  lives: StreakLives;
  nudges: Nudge[];
  drafts: Draft[];
  chat: ChatMessage[];
  events: FitnessEvent[];
  pbs: Record<string, PBEntry[]>;
  challenge: ChallengeProgress | null;
  todayStamp: string;
  settings: AppSettings;
}

export const MEDICAL_DISCLAIMER =
  "Forge is a fitness companion, not a medical professional. Plans are suggestions, not medical advice. Check with a clinician before starting if you have a health condition, injury, or are pregnant.";

export const FITNESS_LEVEL_LABELS: Record<FitnessLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const SEX_LABELS: Record<Sex, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const AVATAR_STYLE_LABELS: Record<AvatarStyle, string> = {
  spark: "Spark",
  bolt: "Bolt",
  wave: "Wave",
};

export const SKIN_TONES = ["#f1c9a5", "#e0ac82", "#c98d64", "#a06a42", "#6f452b"];
export const AVATAR_COLORS = ["#c9a84e", "#ff6b35", "#4ecdc4", "#7b61ff", "#ef476f", "#06d6a0"];
