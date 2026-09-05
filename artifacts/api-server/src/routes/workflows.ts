import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  evidenceTable,
  recommendationsTable,
  workflowsTable,
  workflowStepsTable,
  workLimitsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";

const router: IRouter = Router();
router.use(requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

async function activeCount(coachId: number) {
  const steps = await db.select().from(workflowStepsTable).where(and(
    eq(workflowStepsTable.coachId, coachId),
    inArray(workflowStepsTable.status, ["ready", "in_progress"]),
  ));
  return steps.length;
}

async function capFor(coachId: number) {
  const [row] = await db.select().from(workLimitsTable).where(eq(workLimitsTable.coachId, coachId)).limit(1);
  if (row) return row.maxActiveOrders;
  const [created] = await db.insert(workLimitsTable).values({ coachId }).returning();
  return created!.maxActiveOrders;
}

router.post("/recommendations", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      title: z.string().min(3),
      reason: z.string().default(""),
      area: z.string().default("development"),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(recommendationsTable).values({
      coachId: coach.id,
      ...parsed.data,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/recommendations/:id/accept", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [recommendation] = await db.select().from(recommendationsTable).where(and(
      eq(recommendationsTable.id, Number(req.params.id)),
      eq(recommendationsTable.coachId, coach.id),
    )).limit(1);
    if (!recommendation) throw new HttpError(404, "NOT_FOUND", "Recommendation not found.");
    const cap = await capFor(coach.id);
    const used = await activeCount(coach.id);
    if (used >= cap) {
      throw new HttpError(409, "WORKLOAD_CAP", "No new orders while the WIP cap is full.");
    }
    const [workflow] = await db.insert(workflowsTable).values({
      coachId: coach.id,
      recommendationId: recommendation.id,
      type: recommendation.area,
    }).returning();
    const [step] = await db.insert(workflowStepsTable).values({
      workflowId: workflow!.id,
      coachId: coach.id,
      name: recommendation.title,
      expectedOutput: "Completed action with evidence",
      evidenceRequired: true,
      status: "ready",
    }).returning();
    await db.update(recommendationsTable).set({ status: "accepted" }).where(eq(recommendationsTable.id, recommendation.id));
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "recommendation.accept",
      entityType: "workflow",
      entityId: String(workflow!.id),
    });
    res.status(201).json({ workflow, step });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/workflow-steps/:id/complete", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ evidenceId: z.number().optional() }).safeParse(req.body ?? {});
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [step] = await db.select().from(workflowStepsTable).where(and(
      eq(workflowStepsTable.id, Number(req.params.id)),
      eq(workflowStepsTable.coachId, coach.id),
    )).limit(1);
    if (!step) throw new HttpError(404, "NOT_FOUND", "Step not found.");
    if (step.evidenceRequired) {
      const evidenceId = parsed.success ? parsed.data.evidenceId : undefined;
      if (!evidenceId) throw new HttpError(409, "INVALID_STATE_TRANSITION", "This step requires evidence.");
      const [evidence] = await db.select().from(evidenceTable).where(and(
        eq(evidenceTable.id, evidenceId),
        eq(evidenceTable.coachId, coach.id),
      )).limit(1);
      if (!evidence || evidence.status !== "active") {
        throw new HttpError(409, "INVALID_STATE_TRANSITION", "Evidence is missing or orphaned.");
      }
      const [updated] = await db.update(workflowStepsTable).set({
        status: "done",
        outputEvidenceId: evidence.id,
      }).where(eq(workflowStepsTable.id, step.id)).returning();
      res.json(updated);
      return;
    }
    const [updated] = await db.update(workflowStepsTable).set({ status: "done" }).where(eq(workflowStepsTable.id, step.id)).returning();
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
