import {
  boolean,
  date,
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

export const strategyLocksTable = pgTable("strategy_locks", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("draft"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("strategy_locks_coach_idx").on(table.coachId, table.status),
]);

export const winningDefinitionsTable = pgTable("winning_definitions", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id")
    .notNull()
    .references(() => strategyLocksTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull(),
  statement: text("statement").notNull(),
  metric: text("metric").notNull(),
  targetValue: text("target_value").notNull(),
  unit: text("unit").notNull(),
  deadline: date("deadline").notNull(),
  visibleResult: text("visible_result").notNull(),
  status: text("status").notNull().default("draft"),
});

export const focusArenasTable = pgTable("focus_arenas", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id")
    .notNull()
    .references(() => strategyLocksTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull(),
  who: text("who").notNull(),
  offer: text("offer").notNull(),
  whereOperates: text("where_operates").notNull(),
  howReach: text("how_reach").notNull(),
  exclusions: jsonb("exclusions").$type<string[]>().notNull().default([]),
});

export const advantagesTable = pgTable("advantages", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id")
    .notNull()
    .references(() => strategyLocksTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull(),
  kind: text("kind").notNull(),
  proofClaim: text("proof_claim").notNull().default(""),
  status: text("status").notNull().default("claimed"),
});

export const capabilityChecksTable = pgTable("capability_checks", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id")
    .notNull()
    .references(() => strategyLocksTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  weaknesses: jsonb("weaknesses").$type<string[]>().notNull().default([]),
  missing: jsonb("missing").$type<string[]>().notNull().default([]),
  verdict: text("verdict").notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const policiesTable = pgTable("policies", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id")
    .notNull()
    .references(() => strategyLocksTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull(),
  ruleText: text("rule_text").notNull(),
  kind: text("kind").notNull().default("focus"),
  active: boolean("active").notNull().default(true),
});

export const objectivesTable = pgTable("objectives", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  strategyId: integer("strategy_id"),
  title: text("title").notNull(),
  purpose: text("purpose").notNull().default(""),
  type: text("type").notNull().default("development"),
  role: text("role").notNull().default("supporting"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("draft"),
  successCriteria: text("success_criteria").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("objectives_coach_idx").on(table.coachId, table.status),
]);
