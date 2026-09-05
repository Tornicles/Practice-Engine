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

export const coachPassportsTable = pgTable("coach_passports", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull(),
  identitySummary: text("identity_summary").notNull().default(""),
  specialty: text("specialty").notNull().default(""),
  audience: text("audience").notNull().default(""),
  experienceSummary: text("experience_summary").notNull().default(""),
  existingMethodology: text("existing_methodology").notNull().default(""),
  existingClientsNote: text("existing_clients_note").notNull().default(""),
  existingContentNote: text("existing_content_note").notNull().default(""),
  existingOffersNote: text("existing_offers_note").notNull().default(""),
  confidenceAreas: jsonb("confidence_areas").$type<string[]>().notNull().default([]),
  uncertaintyAreas: jsonb("uncertainty_areas").$type<string[]>().notNull().default([]),
  developmentFocus: text("development_focus").notNull().default(""),
  version: integer("version").notNull().default(1),
  source: text("source").notNull().default("onboarding"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("coach_passports_coach_id_unique").on(table.coachId),
  index("coach_passports_user_id_idx").on(table.userId),
]);

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id"),
  userId: text("user_id"),
  actorType: text("actor_type").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown> | null>(),
  idempotencyKey: text("idempotency_key"),
  requestId: text("request_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("audit_log_coach_created_idx").on(table.coachId, table.createdAt),
  index("audit_log_entity_idx").on(table.entityType, table.entityId),
]);

export const idempotencyKeysTable = pgTable("idempotency_keys", {
  userId: text("user_id").notNull(),
  key: text("key").notNull(),
  command: text("command").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  responseHash: text("response_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("idempotency_keys_user_key_unique").on(table.userId, table.key),
]);

export type CoachPassport = typeof coachPassportsTable.$inferSelect;
export type AuditLogRow = typeof auditLogTable.$inferSelect;
