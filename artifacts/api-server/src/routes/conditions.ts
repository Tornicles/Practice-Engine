import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  conditionsTable,
  db,
  eventsTable,
  skillStatesTable,
  statisticsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, ensurePassport } from "../lib/coach-foundation.ts";
import { sufficiencyFor } from "../lib/skill-projection.ts";

const router: IRouter = Router();

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

async function upsertCondition(input: {
  coachId: number;
  dimension: string;
  subjectType: string;
  level: string;
  sufficiency: string;
  explanation: string;
}) {
  const [existing] = await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, input.coachId));
  const match = existing && existing.dimension === input.dimension && existing.subjectType === input.subjectType
    ? existing
    : (await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, input.coachId)))
      .find((row) => row.dimension === input.dimension && row.subjectType === input.subjectType);
  if (match) {
    const [updated] = await db.update(conditionsTable).set({
      level: input.level,
      sufficiency: input.sufficiency,
      explanation: input.explanation,
      computedAt: new Date(),
    }).where(eq(conditionsTable.id, match.id)).returning();
    return updated;
  }
  const [created] = await db.insert(conditionsTable).values({
    coachId: input.coachId,
    dimension: input.dimension,
    subjectType: input.subjectType,
    level: input.level,
    sufficiency: input.sufficiency,
    explanation: input.explanation,
  }).returning();
  return created;
}

router.get("/conditions", requireAuth, async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const rows = await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/conditions", requireAuth, async (_req, res): Promise<void> => {
  res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Conditions cannot be patched." });
});

router.post("/conditions/recompute", requireAuth, async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const events = await db.select().from(eventsTable).where(eq(eventsTable.coachId, coach.id));
    const skills = await db.select().from(skillStatesTable).where(eq(skillStatesTable.coachId, coach.id));
    const eventCount = events.length;
    await db.delete(statisticsTable).where(eq(statisticsTable.coachId, coach.id));
    await db.insert(statisticsTable).values({
      coachId: coach.id,
      metric: "event_count",
      value: String(eventCount),
      dimension: "practice",
      sampleSize: eventCount,
    });

    const overallSufficiency = sufficiencyFor(eventCount);
    const overallLevel = eventCount === 0 ? "Insufficient Evidence" : "Stable";
    await upsertCondition({
      coachId: coach.id,
      dimension: "practice",
      subjectType: "overall",
      level: overallLevel,
      sufficiency: overallSufficiency,
      explanation: eventCount === 0
        ? "No events recorded. Insufficient Evidence is not poor performance."
        : `Computed from ${eventCount} events using DEFAULT_V1.`,
    });

    for (const skill of skills) {
      const level = skill.sufficiency === "insufficient" || skill.sufficiency === "weak"
        ? "Insufficient Evidence"
        : "Stable";
      await upsertCondition({
        coachId: coach.id,
        dimension: "development",
        subjectType: "skill",
        level,
        sufficiency: skill.sufficiency,
        explanation: `${skill.skillKey} sample ${skill.sampleSize}. Sufficiency guard applied before any decline rule.`,
      });
    }

    const rows = await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
