import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  conditionsTable,
  db,
  recommendationsTable,
  strategyLocksTable,
  workflowStepsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, ensurePassport } from "../lib/coach-foundation.ts";

const router: IRouter = Router();
router.use(requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.get("/home", async (req, res): Promise<void> => {
  try {
    const { coach, passport } = await ensurePassport(authenticatedUserId(req));
    const conditions = await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
    const overall = conditions.find((row) => row.subjectType === "overall") ?? null;
    const [strategy] = await db.select().from(strategyLocksTable).where(and(
      eq(strategyLocksTable.coachId, coach.id),
      eq(strategyLocksTable.status, "active"),
    )).limit(1);
    res.json({
      coach: { id: coach.id, name: coach.name, accountStatus: passport.accountStatus },
      overallLevel: overall?.level ?? "Insufficient Evidence",
      overallExplanation: overall?.explanation ?? "No events recorded.",
      strategyStatus: strategy?.status ?? "none",
      conditions,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/home/today", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const steps = await db.select().from(workflowStepsTable).where(and(
      eq(workflowStepsTable.coachId, coach.id),
      inArray(workflowStepsTable.status, ["ready", "in_progress"]),
    ));
    const recommendations = await db.select().from(recommendationsTable).where(and(
      eq(recommendationsTable.coachId, coach.id),
      eq(recommendationsTable.status, "proposed"),
    )).orderBy(desc(recommendationsTable.id));
    res.json({
      readySteps: steps,
      proposedRecommendations: recommendations,
    });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
