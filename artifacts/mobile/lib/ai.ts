// Forge AI layer (mobile).
// Single plug-in point for a real key: set EXPO_PUBLIC_XAI_API_KEY.
// Without a key every function returns a labeled template/rule-based result —
// the app is fully usable offline. NEVER present template output as AI output.
//
// NOTE: calling xAI directly from the client exposes the key. For production,
// proxy through your own server; this config exists so the swap is one line.
import { buildTemplateSession, exerciseById } from "./exercises";
import {
  occupationAdaptation,
  templateMealsFromIngredients,
  TEMPLATE_GROCERY_GUESSES,
} from "./engine";
import type {
  DietKind,
  Equipment,
  Ingredient,
  Meal,
  OccupationProfile,
  RunPlan,
  RunWorkout,
  WorkoutBlock,
  WorkoutPlan,
} from "./types";
import { uid } from "./format";

export const AI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_XAI_API_KEY ?? "",
  model: "grok-4.5",
  baseUrl: "https://api.x.ai/v1",
};

export type AiResult<T> =
  | { ok: true; data: T; source: "ai" | "template" }
  | { ok: false; error: string };

const hasKey = () => AI_CONFIG.apiKey.length > 0;

type ChatMsg = { role: "system" | "user"; content: string | unknown[] };

async function chat(system: string, user: string, maxTokens = 600): Promise<string | null> {
  if (!hasKey()) return null;
  try {
    const res = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ] as ChatMsg[],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return body.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function parseJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------

export interface GenerateWorkoutOpts {
  focus: "upper" | "lower" | "full" | "core" | "conditioning";
  minutes: 15 | 20 | 30 | 45;
  level: 1 | 2 | 3;
  equipment: Equipment;
  injuries: string;
  occupationNote: string;
  lowImpact?: boolean;
}

export async function generateWorkout(
  opts: GenerateWorkoutOpts,
): Promise<AiResult<{ title: string; blocks: WorkoutBlock[] }>> {
  const text = await chat(
    "You are Forge, an AI personal trainer for home workouts. Bodyweight and minimal equipment only. Never invent exercises outside common calisthenics and dumbbell/band moves. Return JSON only.",
    `Build a ${opts.minutes}-minute ${opts.focus} home workout, level ${opts.level}/3${opts.lowImpact ? ", LOW IMPACT only (no jumps)" : ""}. Equipment: ${Object.keys(opts.equipment).filter((k) => opts.equipment[k as keyof Equipment]).join(", ")}. Injuries to avoid: ${opts.injuries || "none"}. Work context: ${opts.occupationNote}. Return JSON: {"title":"","blocks":[{"exerciseId":"","sets":3,"reps":12,"seconds":0,"restSec":45}]} — use reps OR seconds per block, 4-8 blocks, exerciseId must be one of: ${[...exerciseById.keys()].join(", ")}.`,
    700,
  );
  if (text) {
    const json = parseJson(text);
    if (json && Array.isArray(json.blocks)) {
      const blocks = (json.blocks as Record<string, unknown>[])
        .filter((b) => typeof b.exerciseId === "string" && exerciseById.has(b.exerciseId as string))
        .map((b) => ({
          exerciseId: b.exerciseId as string,
          sets: Number(b.sets) || 3,
          reps: b.reps ? Number(b.reps) : undefined,
          seconds: b.seconds ? Number(b.seconds) : undefined,
          restSec: b.restSec ? Number(b.restSec) : 45,
        }));
      if (blocks.length >= 3) {
        return {
          ok: true,
          source: "ai",
          data: { title: String(json.title ?? "AI workout"), blocks },
        };
      }
    }
  }
  // Template fallback (labeled).
  const built = buildTemplateSession({
    focus: opts.focus,
    minutes: opts.minutes,
    equipment: opts.equipment,
    level: opts.level,
    lowImpact: opts.lowImpact,
  });
  return {
    ok: true,
    source: "template",
    data: {
      title: built.title,
      blocks: built.blocks.map((b) => ({ ...b, restSec: b.restSec })),
    },
  };
}

// ---------------------------------------------------------------------------
// Groceries → meals
// ---------------------------------------------------------------------------

export async function extractGroceries(
  _photoUri: string,
): Promise<AiResult<{ ingredients: Ingredient[]; note: string }>> {
  // Vision requires a key; without one, return a clearly-labeled guess set the
  // user confirms/edits. (With a key, this would POST the image to Grok vision.)
  if (hasKey()) {
    // Conservative: even with a key we keep the confirm step, so return the
    // guess set marked for review rather than pretending to see the photo.
  }
  const guess = TEMPLATE_GROCERY_GUESSES[0];
  return {
    ok: true,
    source: "template",
    data: {
      ingredients: guess.ingredients,
      note:
        "No AI vision key configured — this is a template guess. Tap items to confirm, edit, or type your own.",
    },
  };
}

export async function planMeals(
  ingredients: string[],
  diet: DietKind,
  allergies: string[],
  calorieTarget?: number,
): Promise<AiResult<Meal[]>> {
  const text = await chat(
    "You are Forge's nutrition coach. Build meals ONLY from the listed ingredients. Respect diet and allergies strictly. Return JSON only.",
    `Ingredients on hand: ${ingredients.join(", ") || "none listed"}. Diet: ${diet}. Allergies: ${allergies.join(", ") || "none"}. Daily target: ${calorieTarget ?? "not set"} kcal. Return JSON: {"meals":[{"name":"","ingredients":[""],"prepMin":15,"calories":500,"proteinG":30,"tags":["lunch"]}]} — 3 meals.`,
    700,
  );
  if (text) {
    const json = parseJson(text);
    if (json && Array.isArray(json.meals) && (json.meals as unknown[]).length > 0) {
      return { ok: true, source: "ai", data: json.meals as Meal[] };
    }
  }
  return {
    ok: true,
    source: "template",
    data: templateMealsFromIngredients(ingredients, diet),
  };
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

export async function planRunProgression(
  goal: "5k" | "10k" | "habit",
  longestRunKm: number,
  daysPerWeek: number,
): Promise<AiResult<{ title: string; weeks: RunWorkout[][] }>> {
  const text = await chat(
    "You are Forge's run coach. Build a safe walk/run progression. 10% weekly volume rule. Return JSON only.",
    `Goal: ${goal}. Longest recent run: ${longestRunKm} km. Days per week: ${daysPerWeek}. Return JSON: {"title":"","weeks":[[{"day":"Tuesday","type":"walk_run","title":"","detail":"","targetMin":30}]]} — 8 weeks, ${daysPerWeek} sessions per week.`,
    800,
  );
  if (text) {
    const json = parseJson(text);
    if (json && Array.isArray(json.weeks) && (json.weeks as unknown[]).length > 0) {
      return {
        ok: true,
        source: "ai",
        data: { title: String(json.title ?? "Run plan"), weeks: json.weeks as RunWorkout[][] },
      };
    }
  }
  return { ok: true, source: "template", data: templateRunPlan(goal) };
}

export function templateRunPlan(goal: "5k" | "10k" | "habit"): {
  title: string;
  weeks: RunWorkout[][];
} {
  const weeks: RunWorkout[][] = [];
  const total = goal === "10k" ? 10 : 8;
  for (let w = 1; w <= total; w++) {
    const runMin = Math.min(5 + w * 2, 30);
    const walkMin = Math.max(1, 6 - w);
    const longMin = 15 + w * 5;
    weeks.push([
      { week: w, day: "Tuesday", type: "walk_run", title: "Walk/run intervals", detail: `${runMin} min run / ${walkMin} min walk × 4`, targetMin: 30 },
      { week: w, day: "Thursday", type: "easy", title: "Easy run", detail: `Comfortable pace, ${20 + w * 2} min`, targetMin: 20 + w * 2 },
      { week: w, day: "Saturday", type: "long", title: "Long run", detail: `Slow and steady, ${longMin} min`, targetMin: longMin },
    ]);
  }
  if (goal === "5k") {
    weeks[weeks.length - 1] = [
      { week: total, day: "Saturday", type: "easy", title: "Race day — 5K", detail: "Run the full 5K. You earned this.", targetKm: 5 },
    ];
  }
  return {
    title: goal === "5k" ? "Couch to 5K" : goal === "10k" ? "Base to 10K" : "Run habit builder",
    weeks,
  };
}

// ---------------------------------------------------------------------------
// Coach chat (template brain when offline)
// ---------------------------------------------------------------------------

const COACH_TIPS: { match: RegExp; reply: string }[] = [
  {
    match: /sore|pain|hurt|injur/i,
    reply:
      "Soreness vs. pain matters: dull muscle soreness 24–48h after training is normal; sharp or joint pain is a stop sign. Tell me where it hurts and I'll suggest low-impact swaps — and check the injury note in your profile so future plans route around it.",
  },
  {
    match: /tired|exhaust|energy|sleep/i,
    reply:
      "Low energy day? Do the 15-minute version instead of skipping — consistency beats intensity. If this is day 3+ of fatigue, take a real rest day; the streak forgives you.",
  },
  {
    match: /food|eat|meal|diet|protein|calorie/i,
    reply:
      "Fuel rule of thumb: protein at every meal (~1.6g per kg bodyweight), and eat a real meal 2–3h before training or a banana 45 min before. Scan your groceries in the Fuel tab and I'll build meals from what's actually in your kitchen.",
  },
  {
    match: /run|5k|jog/i,
    reply:
      "Running progress is 80% easy volume. Keep conversational pace for 4 out of 5 runs, add one interval day, and never jump weekly distance more than ~10%. Your run plan in the Run tab already follows this.",
  },
  {
    match: /plateau|stuck|progress/i,
    reply:
      "Plateaus usually mean the stimulus hasn't changed. Try: +1 set on main lifts, a harder progression (knee push-up → push-up), or an extra easy run per week. Rate sessions honestly — the 'too easy' button is how the plan learns.",
  },
  {
    match: /motivat|skip|lazy|quit/i,
    reply:
      "Motivation follows action, not the other way round. Shrink the session until it's laughable — 10 minutes, bodyweight only — and start. You can stop after the warm-up; you won't.",
  },
];

export async function coachReply(
  message: string,
  context: string,
  persona: "steady" | "drill" | "cheer",
): Promise<{ text: string; source: "ai" | "template" }> {
  const personaLine =
    persona === "drill"
      ? "Direct, no-nonsense, military-lite."
      : persona === "cheer"
        ? "Warm, high-energy, encouraging."
        : "Calm, steady, practical.";
  const text = await chat(
    `You are Forge, an AI personal trainer. ${personaLine} You suggest — the user decides. Never give medical diagnoses or contradict a clinician. Keep replies under 120 words.`,
    `Context: ${context}\n\nUser: ${message}`,
    350,
  );
  if (text) return { text: text.trim(), source: "ai" };
  const hit = COACH_TIPS.find((t) => t.match.test(message));
  const base =
    hit?.reply ??
    "Good question. Here's the steady answer: train 3x/week, walk or run 2–3x, protein at every meal, sleep 7–9h. Tell me your goal in one line and I'll get specific.";
  const flavor =
    persona === "drill"
      ? `Listen up. ${base}`
      : persona === "cheer"
        ? `${base} You've got this — one session at a time! 💪`
        : base;
  return { text: flavor, source: "template" };
}

export async function suggestWorkoutDraft(input: {
  focus: "upper" | "lower" | "full" | "core" | "conditioning";
  minutes: 15 | 20 | 30 | 45;
  level: 1 | 2 | 3;
  equipment: Equipment;
  injuries: string;
  occupationNote: string;
}): Promise<AiResult<Omit<WorkoutPlan, "id" | "createdAt">>> {
  const r = await generateWorkout(input);
  if (!r.ok) return r;
  return {
    ok: true,
    source: r.source,
    data: {
      title: r.data.title,
      focus: r.data.title.split(" · ")[0],
      minutes: input.minutes,
      level: input.level === 1 ? "beginner" : input.level === 2 ? "intermediate" : "advanced",
      blocks: r.data.blocks,
      status: "draft",
      source: r.source,
    },
  };
}

export function draftId() {
  return uid("dr");
}

export async function adaptForOccupation(
  occ: OccupationProfile,
  planTitle: string,
): Promise<{ text: string; source: "ai" | "template" }> {
  const text = await chat(
    "You are Forge's programming coach. Adapt training to the user's work life. Short, practical, no fluff.",
    `Work type: ${occ.workType}, ${occ.hoursPerDay}h/day. Plan: ${planTitle}. Give 3-4 concrete adaptations (session length, timing, intensity, recovery). Plain text, under 120 words.`,
    300,
  );
  if (text) return { text: text.trim(), source: "ai" };
  return { text: occupationAdaptation(occ), source: "template" };
}
