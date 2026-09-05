import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  conditionsTable,
  correctionsTable,
  db,
  eventsTable,
  evidenceTable,
  findingsTable,
  investigationsTable,
  resetItemsTable,
  rootCausesTable,
  statisticsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";

const router: IRouter = Router();

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.use(requireAuth);

router.post("/investigations", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      problem: z.string().min(3),
      conditionId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    if (parsed.data.conditionId) {
      const [condition] = await db.select().from(conditionsTable).where(and(
        eq(conditionsTable.id, parsed.data.conditionId),
        eq(conditionsTable.coachId, coach.id),
      )).limit(1);
      if (!condition) throw new HttpError(404, "NOT_FOUND", "Condition not found.");
      if (condition.level === "Insufficient Evidence") {
        throw new HttpError(409, "INVALID_STATE_TRANSITION", "Insufficient Evidence cannot open an investigation.");
      }
    }
    const [row] = await db.insert(investigationsTable).values({
      coachId: coach.id,
      conditionId: parsed.data.conditionId ?? null,
      problem: parsed.data.problem,
    }).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "investigation.create",
      entityType: "investigation",
      entityId: String(row!.id),
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/investigations/:id/findings", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ statement: z.string().min(3) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [investigation] = await db.select().from(investigationsTable).where(and(
      eq(investigationsTable.id, Number(req.params.id)),
      eq(investigationsTable.coachId, coach.id),
    )).limit(1);
    if (!investigation) throw new HttpError(404, "NOT_FOUND", "Investigation not found.");
    const [row] = await db.insert(findingsTable).values({
      investigationId: investigation.id,
      coachId: coach.id,
      statement: parsed.data.statement,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/investigations/:id/corrections", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      actionStatement: z.string().min(3),
      metric: z.string().min(1),
      targetValue: z.string().min(1),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [investigation] = await db.select().from(investigationsTable).where(and(
      eq(investigationsTable.id, Number(req.params.id)),
      eq(investigationsTable.coachId, coach.id),
    )).limit(1);
    if (!investigation) throw new HttpError(404, "NOT_FOUND", "Investigation not found.");
    const [row] = await db.insert(correctionsTable).values({
      investigationId: investigation.id,
      coachId: coach.id,
      actionStatement: parsed.data.actionStatement,
      metric: parsed.data.metric,
      targetValue: parsed.data.targetValue,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/corrections/:id/execute", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.select().from(correctionsTable).where(and(
      eq(correctionsTable.id, Number(req.params.id)),
      eq(correctionsTable.coachId, coach.id),
    )).limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Correction not found.");
    const [updated] = await db.update(correctionsTable).set({ status: "executed" }).where(eq(correctionsTable.id, row.id)).returning();
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/corrections/:id/verify", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.select().from(correctionsTable).where(and(
      eq(correctionsTable.id, Number(req.params.id)),
      eq(correctionsTable.coachId, coach.id),
    )).limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Correction not found.");
    if (row.status !== "executed") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Correction must be executed before verify.");
    }
    const stats = await db.select().from(statisticsTable).where(eq(statisticsTable.coachId, coach.id));
    const match = stats.find((item) => item.metric === row.metric && Number(item.value) >= Number(row.targetValue));
    if (!match) {
      await db.update(investigationsTable).set({ status: "reopened" }).where(eq(investigationsTable.id, row.investigationId));
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Effective requires a later measurement that meets the target.");
    }
    const [updated] = await db.update(correctionsTable).set({ status: "effective" }).where(eq(correctionsTable.id, row.id)).returning();
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/reset/items", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      itemType: z.string().min(1),
      itemId: z.string().min(1),
      decay: z.boolean().default(false),
      reason: z.string().default(""),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(resetItemsTable).values({
      coachId: coach.id,
      ...parsed.data,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/reset/items/:id/apply", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ fate: z.enum(["keep", "simplify", "end"]) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.select().from(resetItemsTable).where(and(
      eq(resetItemsTable.id, Number(req.params.id)),
      eq(resetItemsTable.coachId, coach.id),
    )).limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Reset item not found.");
    const [updated] = await db.update(resetItemsTable).set({ fate: parsed.data.fate }).where(eq(resetItemsTable.id, row.id)).returning();
    const evidence = await db.select().from(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
    const events = await db.select().from(eventsTable).where(eq(eventsTable.coachId, coach.id));
    res.json({ item: updated, evidenceRemaining: evidence.length, eventsRemaining: events.length });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
