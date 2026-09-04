import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coachProfilesTable = pgTable("coach_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique().default("legacy"),
  name: text("name").notNull(),
  niche: text("niche").notNull().default("Leadership & Business Coaching"),
  experienceLevel: text("experience_level").notNull().default("Developing coach"),
  audience: text("audience").notNull().default("Growth-stage leaders"),
  goal: text("goal").notNull().default("Become a better coach"),
  developmentFocus: text("development_focus").notNull().default("Questioning under resistance"),
  workingPreferences: text("working_preferences").notNull().default("Challenge me; require evidence; preserve my voice"),
  onboardingStep: integer("onboarding_step").notNull().default(1),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  practiceScore: integer("practice_score").notNull().default(74),
  streak: integer("streak").notNull().default(17),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const experiencesTable = pgTable("experiences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("legacy"),
  title: text("title").notNull(),
  situation: text("situation").notNull(),
  learning: text("learning").notNull(),
  principle: text("principle").notNull(),
  status: text("status").notNull().default("Principle extracted"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const practiceSessionsTable = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("legacy"),
  scenario: text("scenario").notNull(),
  category: text("category").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const knowledgeAssetsTable = pgTable("knowledge_assets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("legacy"),
  sourceExperienceId: integer("source_experience_id")
    .notNull()
    .references(() => experiencesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("Draft — needs validation"),
  promptStrategy: text("prompt_strategy").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const promptRunsTable = pgTable("prompt_runs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("legacy"),
  engine: text("engine").notNull(),
  strategy: text("strategy").notNull(),
  strategyVersion: text("strategy_version").notNull().default("legacy"),
  strategyIds: jsonb("strategy_ids").$type<string[]>().notNull().default([]),
  strategyFamilies: jsonb("strategy_families").$type<string[]>().notNull().default([]),
  sourceClasses: jsonb("source_classes").$type<string[]>().notNull().default([]),
  chainStages: jsonb("chain_stages").$type<string[]>().notNull().default([]),
  safetyOutcome: text("safety_outcome").notNull().default("not-reviewed"),
  inputSummary: text("input_summary").notNull(),
  outputSummary: text("output_summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const intelligenceOperationsTable = pgTable(
  "intelligence_operations",
  {
    id: serial("id").primaryKey(),
    engine: text("engine").notNull(),
    strategyVersion: text("strategy_version").notNull().default("unselected"),
    strategyFamilies: jsonb("strategy_families").$type<string[]>().notNull().default([]),
    outcome: text("outcome").notNull(),
    failureClass: text("failure_class"),
    latencyMs: integer("latency_ms").notNull(),
    chainStages: jsonb("chain_stages").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("intelligence_operations_created_at_idx").on(table.createdAt),
    index("intelligence_operations_dimensions_idx").on(
      table.engine,
      table.strategyVersion,
      table.outcome,
    ),
  ],
);

export const intelligenceOperationDailyRollupsTable = pgTable(
  "intelligence_operation_daily_rollups",
  {
    day: date("day", { mode: "string" }).notNull(),
    engine: text("engine").notNull(),
    strategyVersion: text("strategy_version").notNull(),
    strategyFamily: text("strategy_family").notNull(),
    outcome: text("outcome").notNull(),
    failureClass: text("failure_class").notNull().default("none"),
    operationCount: integer("operation_count").notNull(),
    latencyTotalMs: bigint("latency_total_ms", { mode: "number" }).notNull(),
    averageLatencyMs: integer("average_latency_ms").notNull(),
    p95LatencyMs: integer("p95_latency_ms").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.day,
        table.engine,
        table.strategyVersion,
        table.strategyFamily,
        table.outcome,
        table.failureClass,
      ],
    }),
    index("intelligence_operation_daily_rollups_day_idx").on(table.day),
  ],
);

export const intelligenceAlertStatesTable = pgTable(
  "intelligence_alert_states",
  {
    alertCode: text("alert_code").notNull(),
    engine: text("engine").notNull(),
    strategyVersion: text("strategy_version").notNull(),
    strategyFamily: text("strategy_family").notNull(),
    active: boolean("active").notNull().default(false),
    notifiedActive: boolean("notified_active").notNull().default(false),
    notificationActive: boolean("notification_active"),
    notificationClaimedAt: timestamp("notification_claimed_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      columns: [
        table.alertCode,
        table.engine,
        table.strategyVersion,
        table.strategyFamily,
      ],
    }),
    index("intelligence_alert_states_dimensions_idx").on(
      table.engine,
      table.strategyVersion,
      table.strategyFamily,
    ),
  ],
);

export const intelligenceRateLimitsTable = pgTable("intelligence_rate_limits", {
  userId: text("user_id").primaryKey(),
  requestCount: integer("request_count").notNull().default(1),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCoachProfileSchema = createInsertSchema(coachProfilesTable).omit({
  id: true,
  userId: true,
  updatedAt: true,
});
export const insertExperienceSchema = createInsertSchema(experiencesTable).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
});
export const insertPracticeSessionSchema = createInsertSchema(
  practiceSessionsTable,
).omit({
  id: true,
  userId: true,
  completedAt: true,
  createdAt: true,
});
export const insertKnowledgeAssetSchema = createInsertSchema(
  knowledgeAssetsTable,
).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
});
export const insertPromptRunSchema = createInsertSchema(promptRunsTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertCoachProfile = z.infer<typeof insertCoachProfileSchema>;
export type CoachProfile = typeof coachProfilesTable.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiencesTable.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeSession = typeof practiceSessionsTable.$inferSelect;
export type InsertKnowledgeAsset = z.infer<typeof insertKnowledgeAssetSchema>;
export type KnowledgeAsset = typeof knowledgeAssetsTable.$inferSelect;
export type InsertPromptRun = z.infer<typeof insertPromptRunSchema>;
export type PromptRun = typeof promptRunsTable.$inferSelect;
export type IntelligenceOperation = typeof intelligenceOperationsTable.$inferSelect;
export type IntelligenceOperationDailyRollup =
  typeof intelligenceOperationDailyRollupsTable.$inferSelect;