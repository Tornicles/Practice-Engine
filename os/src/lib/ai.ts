import { createServerFn } from "@tanstack/react-start";
import { buildTemplateSession } from "./exercises";
import type {
  DietKind,
  Equipment,
  Meal,
  OccupationProfile,
  RunPlan,
  RunWorkout,
  WorkoutBlock,
  WorkoutPlan,
} from "./types";

type ChatResult = { ok: true; text: string } | { ok: false; error: string };

async function chat(system: string, user: string, maxTokens = 600): Promise<ChatResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return { ok: true, text: body.choices[0]?.message.content ?? "" };
}

async function chatVision(system: string, user: string, imageDataUrl: string): Promise<ChatResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: user },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI vision error ${res.status}` };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return { ok: true, text: body.choices[0]?.message.content ?? "" };
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
// Templates: deterministic fallbacks used when AI is unavailable.
// Always labeled "template" in the UI — never presented as AI-generated.
// ---------------------------------------------------------------------------

export function templateWorkout(opts: {
  focus: "upper" | "lower" | "full" | "core" | "conditioning";
  minutes: 15 | 20 | 30 | 45;
  equipment: Equipment;
  level: 1 | 2 | 3;
  lowImpact?: boolean;
}): Omit<WorkoutPlan, "id" | "createdAt"> {
  const built = buildTemplateSession(opts);
  const blocks: WorkoutBlock[] = built.blocks.map((b) => ({ ...b, restSec: b.restSec }));
  return {
    title: built.title,
    focus: built.title.split(" · ")[0],
    minutes: opts.minutes,
    level: opts.level === 1 ? "beginner" : opts.level === 2 ? "intermediate" : "advanced",
    blocks,
    status: "draft",
    source: "template",
  };
}

export function templateMealsFromIngredients(
  ingredients: string[],
  diet: DietKind,
): Meal[] {
  const list = ingredients.slice(0, 12);
  const protein = list.find((i) => /chicken|beef|pork|fish|salmon|tuna|turkey|egg|tofu|lentil|bean/i.test(i)) ?? "protein of choice";
  const veg = list.filter((i) => /broccoli|spinach|pepper|carrot|zucchini|kale|lettuce|tomato|onion|cucumber|mushroom/i.test(i));
  const carb = list.find((i) => /rice|pasta|oat|potato|bread|quinoa|tortilla|noodle/i.test(i)) ?? "grain of choice";
  const vegList = veg.length ? veg.slice(0, 3).join(", ") : "mixed vegetables";
  const dietNote = diet === "vegan" ? " (plant-based)" : diet === "vegetarian" ? " (vegetarian)" : "";
  return [
    { name: `Power breakfast bowl${dietNote}`, ingredients: ["oats or eggs", "fruit", "nuts"].filter(Boolean), prepMin: 10, tags: ["breakfast", "template"] },
    { name: `One-pan ${protein} + ${carb}`, ingredients: [protein, carb, vegList], prepMin: 25, tags: ["lunch", "template"] },
    { name: `Big plate: ${vegList} + ${protein}`, ingredients: [vegList, protein, "olive oil", "spices"], prepMin: 20, tags: ["dinner", "template"] },
  ];
}

export function templateRunPlan(goal: "5k" | "10k" | "habit"): Omit<RunPlan, "id" | "createdAt"> {
  const weeks: RunWorkout[][] = [];
  const total = goal === "10k" ? 10 : 8;
  for (let w = 1; w <= total; w++) {
    const runMin = Math.min(5 + w * 2, 30);
    const walkMin = Math.max(1, 6 - w);
    const longMin = 15 + w * 5;
    weeks.push([
      { week: w, day: "Tuesday", type: "walk_run", title: `Walk/run intervals`, detail: `${runMin} min run / ${walkMin} min walk × 4`, targetMin: 30 },
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
    goal,
    weeks,
    currentWeek: 1,
    status: "draft",
    source: "template",
  };
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

// ---------------------------------------------------------------------------
// Server functions — AI suggests, you decide. Every result starts as a draft.
// ---------------------------------------------------------------------------

export const generateWorkout = createServerFn({ method: "POST" })
  .validator(
    (input: {
      focus: "upper" | "lower" | "full" | "core" | "conditioning";
      minutes: 15 | 20 | 30 | 45;
      level: 1 | 2 | 3;
      equipment: string[];
      injuries: string;
      occupationNote: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const out = await chat(
      "You are Forge, an AI personal trainer for home workouts. Bodyweight and minimal equipment only. Never invent exercises outside common calisthenics and dumbbell/band moves. Return JSON only.",
      `Build a ${data.minutes}-minute ${data.focus} home workout, level ${data.level}/3. Equipment: ${data.equipment.join(", ")}. Injuries to avoid: ${data.injuries || "none"}. Work context: ${data.occupationNote}. Return JSON: {"title":"","blocks":[{"name":"","sets":3,"reps":12,"seconds":0,"restSec":45,"cue":""}]} — use reps OR seconds per block, 4-8 blocks.`,
      700,
    );
    if (!out.ok) return { ok: false as const, error: out.error };
    const json = parseJson(out.text);
    if (!json || !Array.isArray(json.blocks)) return { ok: false as const, error: "Could not parse workout" };
    return { ok: true as const, title: String(json.title ?? "AI workout"), blocks: json.blocks };
  });

export const extractGroceries = createServerFn({ method: "POST" })
  .validator((input: { imageDataUrl: string }) => input)
  .handler(async ({ data }) => {
    const out = await chatVision(
      "You read grocery photos. List every visible food ingredient as JSON only. Be conservative — only name what you can see.",
      'Return JSON: {"ingredients":[{"name":"","qty":""}]}',
      data.imageDataUrl,
    );
    if (!out.ok) return { ok: false as const, error: out.error };
    const json = parseJson(out.text);
    if (!json || !Array.isArray(json.ingredients))
      return { ok: false as const, error: "Could not read ingredients from the photo" };
    return { ok: true as const, ingredients: json.ingredients as { name: string; qty?: string }[] };
  });

export const planMeals = createServerFn({ method: "POST" })
  .validator(
    (input: { ingredients: string[]; diet: string; allergies: string[]; calorieTarget?: number }) => input,
  )
  .handler(async ({ data }) => {
    const out = await chat(
      "You are Forge's nutrition coach. Build meals ONLY from the listed ingredients. Respect diet and allergies strictly. Return JSON only.",
      `Ingredients on hand: ${data.ingredients.join(", ") || "none listed"}. Diet: ${data.diet}. Allergies: ${data.allergies.join(", ") || "none"}. Daily target: ${data.calorieTarget ?? "not set"} kcal. Return JSON: {"meals":[{"name":"","ingredients":[""],"prepMin":15,"calories":500,"proteinG":30,"tags":["lunch"]}]} — 3 meals.`,
      700,
    );
    if (!out.ok) return { ok: false as const, error: out.error };
    const json = parseJson(out.text);
    if (!json || !Array.isArray(json.meals)) return { ok: false as const, error: "Could not parse meals" };
    return { ok: true as const, meals: json.meals as Meal[] };
  });

export const planRunProgression = createServerFn({ method: "POST" })
  .validator((input: { goal: "5k" | "10k" | "habit"; longestRunKm: number; daysPerWeek: number }) => input)
  .handler(async ({ data }) => {
    const out = await chat(
      "You are Forge's run coach. Build a safe walk/run progression. 10% weekly volume rule. Return JSON only.",
      `Goal: ${data.goal}. Longest recent run: ${data.longestRunKm} km. Days per week: ${data.daysPerWeek}. Return JSON: {"title":"","weeks":[[{"day":"Tuesday","type":"walk_run","title":"","detail":"","targetMin":30}]]} — 8 weeks, 2-3 sessions per week.`,
      800,
    );
    if (!out.ok) return { ok: false as const, error: out.error };
    const json = parseJson(out.text);
    if (!json || !Array.isArray(json.weeks)) return { ok: false as const, error: "Could not parse run plan" };
    return {
      ok: true as const,
      title: String(json.title ?? "Run plan"),
      weeks: json.weeks as RunWorkout[][],
    };
  });

export const adaptForOccupation = createServerFn({ method: "POST" })
  .validator((input: { workType: string; hoursPerDay: number; planTitle: string }) => input)
  .handler(async ({ data }) => {
    const out = await chat(
      "You are Forge's programming coach. Adapt training to the user's work life. Short, practical, no fluff.",
      `Work type: ${data.workType}, ${data.hoursPerDay}h/day. Plan: ${data.planTitle}. Give 3-4 concrete adaptations (session length, timing, intensity, recovery). Plain text, under 120 words.`,
      300,
    );
    if (!out.ok) return { ok: false as const, error: out.error };
    return { ok: true as const, text: out.text.trim() };
  });

export const coachChat = createServerFn({ method: "POST" })
  .validator((input: { message: string; context: string; persona: string }) => input)
  .handler(async ({ data }) => {
    const personaLine =
      data.persona === "drill"
        ? "Direct, no-nonsense, military-lite."
        : data.persona === "cheer"
          ? "Warm, high-energy, encouraging."
          : "Calm, steady, practical.";
    const out = await chat(
      `You are Forge, an AI personal trainer. ${personaLine} You suggest — the user decides. Never give medical diagnoses or contradict a clinician. Keep replies under 120 words.`,
      `Context: ${data.context}\n\nUser: ${data.message}`,
      350,
    );
    if (!out.ok) return { ok: false as const, error: out.error };
    return { ok: true as const, text: out.text.trim() };
  });
