import type { WorkoutBlock } from "./types";

// Named benchmark workouts (Freeletics "God workout" pattern, original content).
// For-time efforts: finish all blocks as fast as possible, log total seconds.
export interface BenchmarkDef {
  id: string;
  name: string;
  tagline: string;
  blocks: WorkoutBlock[];
}

export const BENCHMARKS: BenchmarkDef[] = [
  {
    id: "ember-circuit",
    name: "Ember Circuit",
    tagline: "3 rounds for time — the beginner benchmark.",
    blocks: [
      { exerciseId: "squat", sets: 1, reps: 15, restSec: 0 },
      { exerciseId: "knee-pushup", sets: 1, reps: 10, restSec: 0 },
      { exerciseId: "glute-bridge", sets: 1, reps: 15, restSec: 0 },
      { exerciseId: "dead-bug", sets: 1, reps: 10, restSec: 60 },
      { exerciseId: "squat", sets: 1, reps: 15, restSec: 0 },
      { exerciseId: "knee-pushup", sets: 1, reps: 10, restSec: 0 },
      { exerciseId: "glute-bridge", sets: 1, reps: 15, restSec: 0 },
      { exerciseId: "dead-bug", sets: 1, reps: 10, restSec: 60 },
      { exerciseId: "squat", sets: 1, reps: 15, restSec: 0 },
      { exerciseId: "knee-pushup", sets: 1, reps: 10, restSec: 0 },
      { exerciseId: "glute-bridge", sets: 1, reps: 15, restSec: 0 },
      { exerciseId: "dead-bug", sets: 1, reps: 10, restSec: 0 },
    ],
  },
  {
    id: "forge-fifty",
    name: "Forge Fifty",
    tagline: "50 reps of everything. Intermediate proving ground.",
    blocks: [
      { exerciseId: "pushup", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "pushup", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "squat", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "squat", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "bicycle", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "bicycle", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "superman", sets: 1, reps: 25, restSec: 30 },
      { exerciseId: "superman", sets: 1, reps: 25, restSec: 0 },
    ],
  },
  {
    id: "titan-trial",
    name: "Titan Trial",
    tagline: "The full test. Advanced only.",
    blocks: [
      { exerciseId: "burpee", sets: 1, reps: 15, restSec: 45 },
      { exerciseId: "archer-pushup", sets: 1, reps: 10, restSec: 45 },
      { exerciseId: "bulgarian-split", sets: 1, reps: 12, restSec: 45 },
      { exerciseId: "hollow-hold", sets: 1, seconds: 45, restSec: 45 },
      { exerciseId: "mountain-climber", sets: 1, seconds: 45, restSec: 45 },
      { exerciseId: "pike-pushup", sets: 1, reps: 12, restSec: 45 },
      { exerciseId: "single-leg-bridge", sets: 1, reps: 12, restSec: 45 },
      { exerciseId: "plank-shoulder-tap", sets: 1, reps: 20, restSec: 0 },
    ],
  },
];

export const benchmarkById = new Map(BENCHMARKS.map((b) => [b.id, b]));
