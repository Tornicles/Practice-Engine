/**
 * Specialization catalog types — the 40 user-facing specializations.
 * Each maps onto 1–2 of the 13 base movement tracks (exercise eligibility)
 * plus priority exercise families. See doc 28 for the composition model.
 */

export type SpecializationCategory =
  | "weight_body_transformation"
  | "sports_performance"
  | "lifestyle_occupational"
  | "age_life_stages"
  | "strength_conditioning"
  | "adaptive_specialized"
  | "mind_body"
  | "practical_goals";

/** The 13 base movement tracks (exercise-eligibility layer, doc 17). */
export type BaseTrack =
  | "obesity" | "weight_gain" | "weight_loss" | "soccer"
  | "american_football" | "athletics" | "office_worker" | "prenatal"
  | "lean" | "body_shape" | "blue_collar" | "kids" | "older_adult";

export type ExerciseFamilySlug =
  | "core" | "push" | "pull" | "shoulders" | "arms"
  | "legs" | "glutes" | "calves" | "cardio" | "mobility"
  | "balance" | "agility" | "power" | "soccer" | "american_football"
  | "athletics" | "office_worker" | "blue_collar" | "older_adult" | "kids";

export interface SpecializationRecord {
  /** Stable id, e.g. "obesity-fitness". Never reused. */
  slug: string;
  /** Display name, e.g. "Obesity Fitness". */
  name: string;
  category: SpecializationCategory;
  /** One line: who it helps. */
  tagline: string;
  /** 1–2 lines: training focus. */
  trainingFocus: string;
  /** 1–2 lines: expected outcomes. */
  outcomes: string;
  /** elevated → extra safeguards everywhere (doc 17 R1). */
  riskTier: "standard" | "elevated";
  /** 1–2 closest base tracks for exercise eligibility. */
  baseTracks: BaseTrack[];
  /** Exercise families prioritized for this specialization. */
  priorityFamilies: ExerciseFamilySlug[];
  typicalLocation: string;
  /** Hard constraints, e.g. "non-contact only", "post-clearance only". */
  notes?: string;
}
