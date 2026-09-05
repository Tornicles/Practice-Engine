import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const workLimitsTable = pgTable("work_limits", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  maxActiveOrders: integer("max_active_orders").notNull().default(3),
});

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  title: text("title").notNull(),
  reason: text("reason").notNull().default(""),
  area: text("area").notNull().default("development"),
  status: text("status").notNull().default("proposed"),
});

export const workflowsTable = pgTable("workflows", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  recommendationId: integer("recommendation_id"),
  type: text("type").notNull().default("development"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workflowStepsTable = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  coachId: integer("coach_id").notNull(),
  name: text("name").notNull(),
  expectedOutput: text("expected_output").notNull().default(""),
  evidenceRequired: boolean("evidence_required").notNull().default(false),
  outputEvidenceId: integer("output_evidence_id"),
  status: text("status").notNull().default("ready"),
});
