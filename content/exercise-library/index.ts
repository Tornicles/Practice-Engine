export type {
  ExerciseFamily,
  EquipmentCode,
  SpaceRequired,
  SpecializationSlug,
  SafetyFlag,
  ExerciseSeed,
} from "./types";
export { EXERCISES as EXERCISES_CORE_UPPER } from "./seed-a-core-upper";
export { EXERCISES as EXERCISES_LOWER_CARDIO_MOBILITY } from "./seed-b-lower-cardio-mobility";
export { EXERCISES as EXERCISES_BALANCE_SPEED_POWER_SPORT } from "./seed-c-balance-speed-power-sport";
export { EXERCISES as EXERCISES_TRACKS } from "./seed-d-tracks";
export type { ExerciseSeed as Seed } from "./types";
import type { ExerciseSeed } from "./types";
import { EXERCISES as A } from "./seed-a-core-upper";
import { EXERCISES as B } from "./seed-b-lower-cardio-mobility";
import { EXERCISES as C } from "./seed-c-balance-speed-power-sport";
import { EXERCISES as D } from "./seed-d-tracks";

/** The full merged library: 508 deduplicated records, all reviewStatus "draft". */
export const ALL_EXERCISES: ExerciseSeed[] = [...A, ...B, ...C, ...D];
