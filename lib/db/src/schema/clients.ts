import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  status: text("status").notNull().default("prospect"),
  source: text("source").notNull().default("manual"),
  relatedOpportunityId: integer("related_opportunity_id"),
  atRiskReason: text("at_risk_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("clients_coach_status_idx").on(table.coachId, table.status),
]);

export const intakesTable = pgTable("intakes", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id").notNull(),
  situation: text("situation").notNull().default(""),
  goalsStated: text("goals_stated").notNull().default(""),
  constraints: text("constraints").notNull().default(""),
  skipReason: text("skip_reason"),
  status: text("status").notNull().default("draft"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const clientObjectivesTable = pgTable("client_objectives", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id").notNull(),
  title: text("title").notNull(),
  successCriteria: text("success_criteria").notNull().default(""),
  status: text("status").notNull().default("draft"),
});

export const coachingSessionsTable = pgTable("coaching_sessions", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id").notNull(),
  clientObjectiveId: integer("client_objective_id"),
  status: text("status").notNull().default("prep"),
  notes: text("notes").notNull().default(""),
  clientResponse: text("client_response").notNull().default(""),
  outcomeNote: text("outcome_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const commitmentsTable = pgTable("commitments", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id").notNull(),
  sessionId: integer("session_id"),
  text: text("text").notNull(),
  dueOn: date("due_on"),
  status: text("status").notNull().default("open"),
  verifiedBy: text("verified_by").notNull().default("none"),
});

export const outcomesTable = pgTable("outcomes", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id").notNull(),
  kind: text("kind").notNull().default("progress"),
  stateText: text("state_text").notNull(),
  status: text("status").notNull().default("declared"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  clientId: integer("client_id").notNull(),
  sessionId: integer("session_id"),
  sentiment: text("sentiment").notNull().default("unknown"),
  text: text("text").notNull(),
  source: text("source").notNull().default("coach_note"),
});
