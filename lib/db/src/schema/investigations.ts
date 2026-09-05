import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const investigationsTable = pgTable("investigations", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  conditionId: integer("condition_id"),
  problem: text("problem").notNull(),
  status: text("status").notNull().default("triggered"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const findingsTable = pgTable("findings", {
  id: serial("id").primaryKey(),
  investigationId: integer("investigation_id").notNull(),
  coachId: integer("coach_id").notNull(),
  statement: text("statement").notNull(),
});

export const rootCausesTable = pgTable("root_causes", {
  id: serial("id").primaryKey(),
  investigationId: integer("investigation_id").notNull(),
  coachId: integer("coach_id").notNull(),
  statement: text("statement").notNull(),
  status: text("status").notNull().default("proposed"),
});

export const correctionsTable = pgTable("corrections", {
  id: serial("id").primaryKey(),
  investigationId: integer("investigation_id").notNull(),
  coachId: integer("coach_id").notNull(),
  actionStatement: text("action_statement").notNull(),
  metric: text("metric").notNull(),
  targetValue: text("target_value").notNull(),
  status: text("status").notNull().default("planned"),
});

export const resetItemsTable = pgTable("reset_items", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  decay: boolean("decay").notNull().default(false),
  fate: text("fate").notNull().default("pending"),
  reason: text("reason").notNull().default(""),
});
