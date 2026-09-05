import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const SKILL_KEYS = [
  "listening",
  "questioning",
  "reframing",
  "challenging",
  "accountability",
] as const;

export const skillStatesTable = pgTable("skill_states", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  skillKey: text("skill_key").notNull(),
  currentLevel: integer("current_level"),
  confidence: text("confidence").notNull().default("none"),
  sampleSize: integer("sample_size").notNull().default(0),
  sufficiency: text("sufficiency").notNull().default("insufficient"),
  lastSourceType: text("last_source_type"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("skill_states_coach_skill_unique").on(table.coachId, table.skillKey),
]);

export const skillObservationsTable = pgTable("skill_observations", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  skillKey: text("skill_key").notNull(),
  score: integer("score").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  scoreSource: text("score_source").notNull(),
  accepted: integer("accepted").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("skill_observations_coach_skill_idx").on(table.coachId, table.skillKey),
]);

export const developmentFociTable = pgTable("development_foci", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  skillKey: text("skill_key").notNull(),
  status: text("status").notNull().default("active"),
  reason: text("reason").notNull().default(""),
  setAt: timestamp("set_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("development_foci_coach_idx").on(table.coachId, table.status),
]);

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  title: text("title").notNull(),
  skillKey: text("skill_key").notNull(),
  rubric: jsonb("rubric").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentAttemptsTable = pgTable("assessment_attempts", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id")
    .notNull()
    .references(() => assessmentsTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull(),
  score: integer("score"),
  scoreSource: text("score_source").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
