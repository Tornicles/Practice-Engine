import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const measurementsTable = pgTable("measurements", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  metric: text("metric").notNull(),
  value: numeric("value").notNull(),
  unit: text("unit").notNull().default("count"),
  period: text("period").notNull().default("all"),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  dimension: text("dimension").notNull(),
  signal: text("signal").notNull().default("signal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statisticsTable = pgTable("statistics", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  metric: text("metric").notNull(),
  value: numeric("value").notNull(),
  period: text("period").notNull().default("all"),
  dimension: text("dimension").notNull(),
  sampleSize: integer("sample_size").notNull().default(0),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("statistics_coach_metric_idx").on(table.coachId, table.metric)]);

export const conditionsTable = pgTable("conditions", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  dimension: text("dimension").notNull(),
  subjectType: text("subject_type").notNull().default("overall"),
  subjectId: text("subject_id"),
  level: text("level").notNull(),
  ruleCode: text("rule_code").notNull().default("DEFAULT_V1"),
  ruleVersion: integer("rule_version").notNull().default(1),
  sufficiency: text("sufficiency").notNull(),
  explanation: text("explanation").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("conditions_coach_dim_idx").on(table.coachId, table.dimension)]);
