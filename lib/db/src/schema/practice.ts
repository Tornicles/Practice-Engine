import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coachProfilesTable = pgTable("coach_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  niche: text("niche").notNull().default("Leadership & Business Coaching"),
  experienceLevel: text("experience_level").notNull().default("Developing coach"),
  audience: text("audience").notNull().default("Growth-stage leaders"),
  goal: text("goal").notNull().default("Become a better coach"),
  developmentFocus: text("development_focus").notNull().default("Questioning under resistance"),
  practiceScore: integer("practice_score").notNull().default(74),
  streak: integer("streak").notNull().default(17),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const experiencesTable = pgTable("experiences", {
  id: serial("id").primaryKey(),
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
  scenario: text("scenario").notNull(),
  category: text("category").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCoachProfileSchema = createInsertSchema(coachProfilesTable).omit({
  id: true,
  updatedAt: true,
});
export const insertExperienceSchema = createInsertSchema(experiencesTable).omit({
  id: true,
  status: true,
  createdAt: true,
});
export const insertPracticeSessionSchema = createInsertSchema(
  practiceSessionsTable,
).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export type InsertCoachProfile = z.infer<typeof insertCoachProfileSchema>;
export type CoachProfile = typeof coachProfilesTable.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiencesTable.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeSession = typeof practiceSessionsTable.$inferSelect;