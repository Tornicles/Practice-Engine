import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  evidenceTable,
  expertiseTable,
  lessonsTable,
  patternInstancesTable,
  patternsTable,
  principlesTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";
import { appendEvent } from "../lib/events.ts";

const router: IRouter = Router();

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.use(requireAuth);

router.post("/evidence", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      kind: z.enum(["fact", "observation", "interpretation", "assumption", "ai_hypothesis"]),
      claim: z.string().min(3),
      sourceType: z.string().min(1),
      sourceId: z.string().min(1),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const event = await appendEvent({
      coachId: coach.id,
      userId,
      type: "EVIDENCE_RECORDED",
      entityType: parsed.data.sourceType,
      entityId: parsed.data.sourceId,
    });
    const [row] = await db.insert(evidenceTable).values({
      coachId: coach.id,
      kind: parsed.data.kind,
      claim: parsed.data.claim,
      sourceEventId: event?.id ?? null,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      reliability: parsed.data.kind === "ai_hypothesis" ? "low" : "medium",
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/lessons", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      statement: z.string().min(3),
      experienceId: z.number().optional(),
      source: z.enum(["coach", "ai_draft"]).default("coach"),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [row] = await db.insert(lessonsTable).values({
      coachId: coach.id,
      statement: parsed.data.statement,
      experienceId: parsed.data.experienceId ?? null,
      source: parsed.data.source,
      status: parsed.data.source === "ai_draft" ? "draft" : "accepted",
    }).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "LESSON_CREATED",
      entityType: "lesson",
      entityId: String(row!.id),
      actorType: parsed.data.source === "ai_draft" ? "ai" : "coach",
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/patterns", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ statement: z.string().min(3) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(patternsTable).values({
      coachId: coach.id,
      statement: parsed.data.statement,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/patterns/:id/instances", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ sourceType: z.string(), sourceId: z.string() }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [pattern] = await db.select().from(patternsTable).where(and(
      eq(patternsTable.id, Number(req.params.id)),
      eq(patternsTable.coachId, coach.id),
    )).limit(1);
    if (!pattern) throw new HttpError(404, "NOT_FOUND", "Pattern not found.");
    await db.insert(patternInstancesTable).values({
      patternId: pattern.id,
      coachId: coach.id,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
    });
    const instances = await db.select().from(patternInstancesTable).where(eq(patternInstancesTable.patternId, pattern.id));
    let status = pattern.status;
    if (instances.length >= pattern.minInstances && pattern.status === "proposed") {
      const [updated] = await db.update(patternsTable).set({ status: "accepted" }).where(eq(patternsTable.id, pattern.id)).returning();
      status = updated?.status ?? "accepted";
    }
    res.json({ patternId: pattern.id, instances: instances.length, status });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/principles", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      statement: z.string().min(3),
      patternId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(principlesTable).values({
      coachId: coach.id,
      statement: parsed.data.statement,
      patternId: parsed.data.patternId ?? null,
      status: parsed.data.patternId ? "accepted" : "proposed",
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/expertise", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      title: z.string().min(3),
      statement: z.string().min(3),
      principleId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [row] = await db.insert(expertiseTable).values({
      coachId: coach.id,
      title: parsed.data.title,
      statement: parsed.data.statement,
      principleId: parsed.data.principleId ?? null,
    }).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "expertise.create",
      entityType: "expertise",
      entityId: String(row!.id),
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/expertise/:id/validate", async (req, res): Promise<void> => {
  try {
    if (req.header("x-actor-type") === "ai") {
      throw new HttpError(422, "BUSINESS_RULE", "AI cannot validate expertise.");
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [item] = await db.select().from(expertiseTable).where(and(
      eq(expertiseTable.id, Number(req.params.id)),
      eq(expertiseTable.coachId, coach.id),
    )).limit(1);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Expertise not found.");
    const [principle] = item.principleId
      ? await db.select().from(principlesTable).where(eq(principlesTable.id, item.principleId))
      : [];
    if (!principle || principle.status !== "accepted") {
      throw new HttpError(422, "BUSINESS_RULE", "Validation requires an accepted principle.");
    }
    const [pattern] = principle.patternId
      ? await db.select().from(patternsTable).where(eq(patternsTable.id, principle.patternId))
      : [];
    if (!pattern || pattern.status !== "accepted") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Validation requires an accepted pattern.");
    }
    const evidence = await db.select().from(evidenceTable).where(and(
      eq(evidenceTable.coachId, coach.id),
      eq(evidenceTable.status, "active"),
    ));
    const usable = evidence.filter((row) => row.kind === "fact" || row.kind === "observation");
    if (usable.length < 2) {
      throw new HttpError(422, "BUSINESS_RULE", "Validation requires two fact or observation evidence rows.");
    }
    if (usable.some((row) => row.status === "orphaned")) {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Orphaned evidence cannot validate.");
    }
    const [updated] = await db.update(expertiseTable).set({ status: "validated" }).where(eq(expertiseTable.id, item.id)).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "EXPERTISE_VALIDATED",
      entityType: "expertise",
      entityId: String(item.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
