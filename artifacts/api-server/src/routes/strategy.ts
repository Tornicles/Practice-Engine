import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  advantagesTable,
  capabilityChecksTable,
  db,
  focusArenasTable,
  policiesTable,
  strategyLocksTable,
  winningDefinitionsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import {
  HttpError,
  appendAudit,
  ensurePassport,
} from "../lib/coach-foundation.ts";
import { assertLockReady, assertSingleReadingWin } from "../lib/strategy-lock.ts";

const router: IRouter = Router();
router.use("/strategy", requireAuth);

const draftSchema = z.object({
  statement: z.string().min(8),
  metric: z.string().min(1),
  targetValue: z.string().min(1),
  unit: z.string().min(1),
  deadline: z.string().min(8),
  visibleResult: z.string().min(1),
  who: z.string().min(1),
  offer: z.string().min(1),
  whereOperates: z.string().min(1),
  howReach: z.string().min(1),
  exclusions: z.array(z.string()).default([]),
  advantages: z.array(z.string()).min(1).max(2),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  verdict: z.enum(["keep_strategy", "adjust_strategy"]),
  policy: z.string().min(1),
});

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.get("/strategy", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [active] = await db
      .select()
      .from(strategyLocksTable)
      .where(and(eq(strategyLocksTable.coachId, coach.id), eq(strategyLocksTable.status, "active")))
      .limit(1);
    res.json({ active: active ?? null });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/strategy", async (req, res): Promise<void> => {
  try {
    const parsed = draftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    assertSingleReadingWin(parsed.data.statement);
    const userId = authenticatedUserId(req);
    const { coach, passport } = await ensurePassport(userId);
    if (passport.accountStatus === "closed") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Closed coach cannot draft strategy.");
    }
    const [lock] = await db
      .insert(strategyLocksTable)
      .values({ coachId: coach.id, userId, status: "draft" })
      .returning();
    await db.insert(winningDefinitionsTable).values({
      strategyId: lock!.id,
      coachId: coach.id,
      statement: parsed.data.statement,
      metric: parsed.data.metric,
      targetValue: parsed.data.targetValue,
      unit: parsed.data.unit,
      deadline: parsed.data.deadline,
      visibleResult: parsed.data.visibleResult,
    });
    await db.insert(focusArenasTable).values({
      strategyId: lock!.id,
      coachId: coach.id,
      who: parsed.data.who,
      offer: parsed.data.offer,
      whereOperates: parsed.data.whereOperates,
      howReach: parsed.data.howReach,
      exclusions: parsed.data.exclusions,
    });
    for (const kind of parsed.data.advantages) {
      await db.insert(advantagesTable).values({
        strategyId: lock!.id,
        coachId: coach.id,
        kind,
      });
    }
    await db.insert(capabilityChecksTable).values({
      strategyId: lock!.id,
      coachId: coach.id,
      strengths: parsed.data.strengths,
      weaknesses: parsed.data.weaknesses,
      missing: parsed.data.missing,
      verdict: parsed.data.verdict,
    });
    await db.insert(policiesTable).values({
      strategyId: lock!.id,
      coachId: coach.id,
      ruleText: parsed.data.policy,
      kind: "focus",
    });
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "strategy.draft",
      entityType: "strategy",
      entityId: String(lock!.id),
    });
    res.status(201).json({ strategyId: lock!.id, status: "draft" });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/strategy/:id/lock", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach, passport } = await ensurePassport(userId);
    if (passport.accountStatus === "closed") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Closed coach cannot lock strategy.");
    }
    const strategyId = Number(req.params.id);
    const [lock] = await db
      .select()
      .from(strategyLocksTable)
      .where(and(eq(strategyLocksTable.id, strategyId), eq(strategyLocksTable.coachId, coach.id)))
      .limit(1);
    if (!lock) throw new HttpError(404, "NOT_FOUND", "Strategy not found.");
    if (lock.status === "active") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Strategy is already locked.");
    }
    const [existingActive] = await db
      .select()
      .from(strategyLocksTable)
      .where(and(eq(strategyLocksTable.coachId, coach.id), eq(strategyLocksTable.status, "active")))
      .limit(1);
    if (existingActive) {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Another winning definition is already active.");
    }
    const [win] = await db.select().from(winningDefinitionsTable).where(eq(winningDefinitionsTable.strategyId, strategyId)).limit(1);
    const [arena] = await db.select().from(focusArenasTable).where(eq(focusArenasTable.strategyId, strategyId)).limit(1);
    const advantages = await db.select().from(advantagesTable).where(eq(advantagesTable.strategyId, strategyId));
    const [check] = await db.select().from(capabilityChecksTable).where(eq(capabilityChecksTable.strategyId, strategyId)).limit(1);
    const policies = await db.select().from(policiesTable).where(eq(policiesTable.strategyId, strategyId));
    if (!win || !arena || !check) throw new HttpError(409, "INVALID_STATE_TRANSITION", "Strategy draft is incomplete.");
    assertLockReady({
      statement: win.statement,
      exclusions: arena.exclusions,
      advantages: advantages.map((row) => row.kind),
      verdict: check.verdict,
      policies: policies.length,
      strengths: check.strengths,
    });
    const [updated] = await db
      .update(strategyLocksTable)
      .set({ status: "active", lockedAt: new Date() })
      .where(eq(strategyLocksTable.id, strategyId))
      .returning();
    await db
      .update(winningDefinitionsTable)
      .set({ status: "active" })
      .where(eq(winningDefinitionsTable.strategyId, strategyId));
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "strategy.lock",
      entityType: "strategy",
      entityId: String(strategyId),
    });
    res.json({ strategyId, status: updated?.status ?? "active" });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
