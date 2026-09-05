import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, objectivesTable, strategyLocksTable } from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";

const router: IRouter = Router();
router.use("/objectives", requireAuth);

const createSchema = z.object({
  title: z.string().min(3),
  purpose: z.string().default(""),
  servesWin: z.boolean().default(false),
  type: z.enum(["development", "client", "content", "commercial", "product", "practice"]).default("development"),
  role: z.enum(["primary", "supporting"]).default("supporting"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  successCriteria: z.string().default(""),
});

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.get("/objectives", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const rows = await db
      .select()
      .from(objectivesTable)
      .where(eq(objectivesTable.coachId, coach.id))
      .orderBy(desc(objectivesTable.createdAt));
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/objectives", async (req, res): Promise<void> => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach, passport } = await ensurePassport(userId);
    if (passport.accountStatus === "closed") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Closed coach cannot create objectives.");
    }
    const [active] = await db
      .select()
      .from(strategyLocksTable)
      .where(and(eq(strategyLocksTable.coachId, coach.id), eq(strategyLocksTable.status, "active")))
      .limit(1);
    const [row] = await db
      .insert(objectivesTable)
      .values({
        coachId: coach.id,
        strategyId: active?.id ?? null,
        ...parsed.data,
      })
      .returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "objective.create",
      entityType: "objective",
      entityId: String(row!.id),
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/objectives/:id/activate", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const id = Number(req.params.id);
    const [row] = await db
      .select()
      .from(objectivesTable)
      .where(and(eq(objectivesTable.id, id), eq(objectivesTable.coachId, coach.id)))
      .limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Objective not found.");
    if (row.status === "done") throw new HttpError(409, "INVALID_STATE_TRANSITION", "Done objectives cannot activate.");
    const [activeLock] = await db
      .select()
      .from(strategyLocksTable)
      .where(and(eq(strategyLocksTable.coachId, coach.id), eq(strategyLocksTable.status, "active")))
      .limit(1);
    if (activeLock && !row.servesWin) {
      throw new HttpError(422, "BUSINESS_RULE", "Objective does not serve the locked win.");
    }
    if (row.role === "primary") {
      const [existingPrimary] = await db
        .select()
        .from(objectivesTable)
        .where(and(
          eq(objectivesTable.coachId, coach.id),
          eq(objectivesTable.role, "primary"),
          eq(objectivesTable.status, "active"),
        ))
        .limit(1);
      if (existingPrimary && existingPrimary.id !== row.id) {
        throw new HttpError(409, "INVALID_STATE_TRANSITION", "Another primary objective is already active.");
      }
    }
    const [updated] = await db
      .update(objectivesTable)
      .set({ status: "active", strategyId: activeLock?.id ?? row.strategyId })
      .where(eq(objectivesTable.id, row.id))
      .returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "objective.activate",
      entityType: "objective",
      entityId: String(row.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/objectives/:id/declare-done", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const id = Number(req.params.id);
    const [row] = await db
      .select()
      .from(objectivesTable)
      .where(and(eq(objectivesTable.id, id), eq(objectivesTable.coachId, coach.id)))
      .limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Objective not found.");
    if (row.status !== "active") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Only active objectives can be declared done.");
    }
    const [updated] = await db
      .update(objectivesTable)
      .set({ status: "done" })
      .where(eq(objectivesTable.id, row.id))
      .returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "objective.declareDone",
      entityType: "objective",
      entityId: String(row.id),
      after: { verified: false },
    });
    res.json({ ...updated, verified: false });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
