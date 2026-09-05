import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  assessmentAttemptsTable,
  assessmentsTable,
  db,
  developmentFociTable,
  skillObservationsTable,
  skillStatesTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";
import { confidenceFor, projectsIntoLevel, sufficiencyFor } from "../lib/skill-projection.ts";

const router: IRouter = Router();
router.use("/development", requireAuth);

const skillKey = z.enum([
  "listening",
  "questioning",
  "reframing",
  "challenging",
  "accountability",
]);

const observationSchema = z.object({
  skillKey,
  score: z.number().int().min(0).max(100),
  sourceType: z.enum(["practice", "simulation", "assessment", "session"]),
  sourceId: z.string().optional(),
  scoreSource: z.enum(["coach", "rubric", "ai_draft"]),
});

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

async function recomputeSkill(coachId: number, key: string) {
  const accepted = await db
    .select()
    .from(skillObservationsTable)
    .where(and(
      eq(skillObservationsTable.coachId, coachId),
      eq(skillObservationsTable.skillKey, key),
      eq(skillObservationsTable.accepted, 1),
    ));
  const live = accepted.filter((row) => row.scoreSource !== "ai_draft");
  const sampleSize = live.length;
  const currentLevel = sampleSize
    ? Math.round(live.reduce((sum, row) => sum + row.score, 0) / sampleSize)
    : null;
  const last = accepted.at(-1);
  const values = {
    currentLevel,
    sampleSize,
    sufficiency: sufficiencyFor(sampleSize),
    confidence: confidenceFor(sampleSize, last?.scoreSource ?? "coach"),
    lastSourceType: last?.sourceType ?? null,
    updatedAt: new Date(),
  };
  const [existing] = await db
    .select()
    .from(skillStatesTable)
    .where(and(eq(skillStatesTable.coachId, coachId), eq(skillStatesTable.skillKey, key)))
    .limit(1);
  if (existing) {
    const [updated] = await db.update(skillStatesTable).set(values).where(eq(skillStatesTable.id, existing.id)).returning();
    return updated;
  }
  const [created] = await db.insert(skillStatesTable).values({ coachId, skillKey: key, ...values }).returning();
  return created;
}

router.get("/development/skills", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const rows = await db.select().from(skillStatesTable).where(eq(skillStatesTable.coachId, coach.id));
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/development/observations", async (req, res): Promise<void> => {
  try {
    const parsed = observationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const accepted = projectsIntoLevel(parsed.data.scoreSource, parsed.data.scoreSource !== "ai_draft") ? 1 : 0;
    const [row] = await db.insert(skillObservationsTable).values({
      coachId: coach.id,
      skillKey: parsed.data.skillKey,
      score: parsed.data.score,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId ?? null,
      scoreSource: parsed.data.scoreSource,
      accepted,
    }).returning();
    const state = await recomputeSkill(coach.id, parsed.data.skillKey);
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: parsed.data.scoreSource === "ai_draft" ? "ai" : "coach",
      action: "skill.observe",
      entityType: "skill_observation",
      entityId: String(row!.id),
    });
    res.status(201).json({ observation: row, state });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/development/observations/:id/accept", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const id = Number(req.params.id);
    const [row] = await db
      .select()
      .from(skillObservationsTable)
      .where(and(eq(skillObservationsTable.id, id), eq(skillObservationsTable.coachId, coach.id)))
      .limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Observation not found.");
    await db.update(skillObservationsTable).set({
      accepted: 1,
      scoreSource: row.scoreSource === "ai_draft" ? "coach" : row.scoreSource,
    }).where(eq(skillObservationsTable.id, row.id));
    const state = await recomputeSkill(coach.id, row.skillKey);
    res.json({ state });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/development/focus", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ skillKey, reason: z.string().default("") }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    await db.update(developmentFociTable).set({ status: "retired" }).where(and(
      eq(developmentFociTable.coachId, coach.id),
      eq(developmentFociTable.status, "active"),
    ));
    const [focus] = await db.insert(developmentFociTable).values({
      coachId: coach.id,
      skillKey: parsed.data.skillKey,
      reason: parsed.data.reason,
    }).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "development.setFocus",
      entityType: "development_focus",
      entityId: String(focus!.id),
    });
    res.status(201).json(focus);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/development/focus", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [focus] = await db
      .select()
      .from(developmentFociTable)
      .where(and(eq(developmentFociTable.coachId, coach.id), eq(developmentFociTable.status, "active")))
      .orderBy(desc(developmentFociTable.setAt))
      .limit(1);
    res.json(focus ?? null);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/development/assessments", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ title: z.string().min(3), skillKey }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(assessmentsTable).values({
      coachId: coach.id,
      title: parsed.data.title,
      skillKey: parsed.data.skillKey,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/development/assessments/:id/attempts", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      score: z.number().int().min(0).max(100),
      scoreSource: z.enum(["coach", "rubric", "ai_draft"]),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const assessmentId = Number(req.params.id);
    const [assessment] = await db
      .select()
      .from(assessmentsTable)
      .where(and(eq(assessmentsTable.id, assessmentId), eq(assessmentsTable.coachId, coach.id)))
      .limit(1);
    if (!assessment) throw new HttpError(404, "NOT_FOUND", "Assessment not found.");
    const live = parsed.data.scoreSource !== "ai_draft";
    const [attempt] = await db.insert(assessmentAttemptsTable).values({
      assessmentId,
      coachId: coach.id,
      score: parsed.data.score,
      scoreSource: parsed.data.scoreSource,
      status: live ? "evaluated" : "draft",
    }).returning();
    if (live) {
      await db.insert(skillObservationsTable).values({
        coachId: coach.id,
        skillKey: assessment.skillKey,
        score: parsed.data.score,
        sourceType: "assessment",
        sourceId: String(attempt!.id),
        scoreSource: parsed.data.scoreSource,
        accepted: 1,
      });
      await recomputeSkill(coach.id, assessment.skillKey);
    }
    res.status(201).json(attempt);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
