/**
 * Master Exercise Library — seed record types.
 * Status: DRAFT. Every record requires qualified reviewer validation
 * (doc 17 lifecycle) before it becomes selectable by the Workout Composer.
 */

/** 20 exercise families (user's master catalog). */
export type ExerciseFamily =
  | "core" | "push" | "pull" | "shoulders" | "arms"
  | "legs" | "glutes" | "calves" | "cardio" | "mobility"
  | "balance" | "agility" | "power" | "soccer" | "american_football"
  | "athletics" | "office_worker" | "blue_collar" | "older_adult" | "kids";

/** Equipment codes. BW/DB/RB/CH/OUT/MAT from the catalog; extended for the rest. */
export type EquipmentCode =
  | "BW"    // bodyweight
  | "DB"    // dumbbells
  | "RB"    // resistance bands
  | "CH"    // sturdy chair or step
  | "OUT"   // outdoor space
  | "MAT"   // optional exercise mat
  | "TWL"   // towel
  | "STR"   // stairs
  | "DRW"   // doorway
  | "WALL"  // wall
  | "ANCH"  // secure anchor (for bands)
  | "DESK"  // stable desk
  | "BALL"  // soft ball
  | "BALL_S"// soccer ball
  | "BALL_F"// american football
  | "PART"  // partner
  | "MARK"  // markers/cones
  | "HOUSE" // safe household objects
  | "SUP";  // appropriate supervision

export type SpaceRequired = "small_indoor" | "medium_indoor" | "outdoor";

/** 13 specialization tracks. */
export type SpecializationSlug =
  | "obesity" | "weight_gain" | "weight_loss" | "soccer"
  | "american_football" | "athletics" | "office_worker" | "prenatal"
  | "lean" | "body_shape" | "blue_collar" | "kids" | "older_adult";

/** Controlled safety-flag vocabulary. */
export type SafetyFlag =
  | "knee_load" | "back_load" | "shoulder_load" | "wrist_load" | "ankle_load" | "hamstring_load"
  | "balance_risk" | "fall_risk" | "high_impact" | "overhead"
  | "spinal_flexion" | "breath_hold" | "grip_demand"
  | "needs_anchor" | "needs_partner" | "needs_supervision"
  | "pregnancy_review" | "youth_only" | "older_adult_screen";

export interface ExerciseSeed {
  /** Canonical stable id, e.g. "push-up". Never reused. */
  slug: string;
  /** Canonical display name, e.g. "Push-Up". */
  name: string;
  family: ExerciseFamily;
  /** Slug of the canonical exercise when this record is a variant. */
  variantOf?: string;
  equipment: EquipmentCode[];
  space: SpaceRequired;
  /** 1 (most accessible) – 5 (advanced). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  movementPattern: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  /** Short prerequisite text, e.g. "can sit-to-stand 10x unassisted". */
  prerequisites?: string;
  /** Eligible tracks; use ["all"] for general exercises. */
  specializations: ("all" | SpecializationSlug)[];
  safetyFlags: SafetyFlag[];
  /** All seed records start as draft — reviewer validation required. */
  reviewStatus: "draft";
  /** Catalog number(s) from the user's master list, for traceability. */
  catalogRefs: number[];
}
