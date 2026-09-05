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

export const eventsTable = pgTable("engine_events", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  idempotencyKey: text("idempotency_key"),
  actorType: text("actor_type").notNull().default("coach"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("engine_events_coach_type_idx").on(table.coachId, table.type),
  uniqueIndex("engine_events_idempotency_idx").on(table.coachId, table.idempotencyKey),
]);

export const evidenceTable = pgTable("evidence", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  kind: text("kind").notNull(),
  claim: text("claim").notNull(),
  sourceEventId: integer("source_event_id"),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  reliability: text("reliability").notNull().default("medium"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  experienceId: integer("experience_id"),
  statement: text("statement").notNull(),
  status: text("status").notNull().default("draft"),
  source: text("source").notNull().default("coach"),
});

export const patternsTable = pgTable("patterns", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  statement: text("statement").notNull(),
  status: text("status").notNull().default("proposed"),
  minInstances: integer("min_instances").notNull().default(2),
});

export const patternInstancesTable = pgTable("pattern_instances", {
  id: serial("id").primaryKey(),
  patternId: integer("pattern_id").notNull(),
  coachId: integer("coach_id").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
});

export const principlesTable = pgTable("principles", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  patternId: integer("pattern_id"),
  statement: text("statement").notNull(),
  status: text("status").notNull().default("proposed"),
  source: text("source").notNull().default("coach"),
});

export const expertiseTable = pgTable("expertise", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  title: text("title").notNull(),
  statement: text("statement").notNull(),
  principleId: integer("principle_id"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
