import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const methodsTable = pgTable("methods", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  purpose: text("purpose").notNull().default(""),
  expertiseId: integer("expertise_id"),
  principleId: integer("principle_id"),
  status: text("status").notNull().default("draft"),
  currentVersionId: integer("current_version_id"),
  commercialEligible: boolean("commercial_eligible").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("methods_coach_idx").on(table.coachId, table.status)]);

export const methodVersionsTable = pgTable("method_versions", {
  id: serial("id").primaryKey(),
  methodId: integer("method_id").notNull(),
  coachId: integer("coach_id").notNull(),
  version: integer("version").notNull(),
  changelog: text("changelog").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const methodTestsTable = pgTable("method_tests", {
  id: serial("id").primaryKey(),
  methodId: integer("method_id").notNull(),
  versionId: integer("version_id").notNull(),
  coachId: integer("coach_id").notNull(),
  prediction: text("prediction").notNull().default(""),
  result: text("result"),
  evidenceId: integer("evidence_id"),
  status: text("status").notNull().default("planned"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
