import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const contentItemsTable = pgTable("content_items", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("post"),
  status: text("status").notNull().default("idea"),
  methodId: integer("method_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const contentSignalsTable = pgTable("content_signals", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  contentId: integer("content_id").notNull(),
  kind: text("kind").notNull(),
  countsAsSignal: boolean("counts_as_signal").notNull(),
});

export const proofItemsTable = pgTable("proof_items", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  claim: text("claim").notNull(),
  evidenceId: integer("evidence_id"),
  status: text("status").notNull().default("draft"),
});

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  name: text("name").notNull(),
  promise: text("promise").notNull().default(""),
  methodId: integer("method_id"),
  productId: integer("product_id"),
  status: text("status").notNull().default("draft"),
  commercialGatePassed: boolean("commercial_gate_passed").notNull().default(false),
});

export const prospectsTable = pgTable("prospects", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("new"),
  clientId: integer("client_id"),
});

export const opportunitiesTable = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  prospectId: integer("prospect_id").notNull(),
  offerId: integer("offer_id").notNull(),
  status: text("status").notNull().default("open"),
  amount: numeric("amount"),
  clientId: integer("client_id"),
});
