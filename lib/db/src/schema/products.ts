import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { coachProfilesTable } from "./practice.ts";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .notNull()
    .references(() => coachProfilesTable.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("course"),
  offerId: integer("offer_id"),
  methodId: integer("method_id"),
  status: text("status").notNull().default("draft"),
});

export const productModulesTable = pgTable("product_modules", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  title: text("title").notNull(),
  sequence: integer("sequence").notNull().default(1),
});

export const productLessonsTable = pgTable("product_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  sequence: integer("sequence").notNull().default(1),
  expectedOutput: text("expected_output"),
});

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  productId: integer("product_id").notNull(),
  clientId: integer("client_id"),
  learnerName: text("learner_name").notNull(),
  status: text("status").notNull().default("invited"),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  droppedAt: timestamp("dropped_at", { withTimezone: true }),
});

export const lessonProgressTable = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  status: text("status").notNull().default("not_started"),
  output: text("output"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
