import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  evidenceTable,
  methodsTable,
  methodTestsTable,
  methodVersionsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";
import { appendEvent } from "../lib/events.ts";

const router: IRouter = Router();
router.use("/methods", requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

async function ownMethod(coachId: number, id: number) {
  const [row] = await db.select().from(methodsTable).where(and(eq(methodsTable.id, id), eq(methodsTable.coachId, coachId))).limit(1);
  if (!row) throw new HttpError(404, "NOT_FOUND", "Method not found.");
  return row;
}

router.post("/methods", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      title: z.string().min(3),
      purpose: z.string().default(""),
      principleId: z.number().optional(),
      expertiseId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [method] = await db.insert(methodsTable).values({
      coachId: coach.id,
      title: parsed.data.title,
      purpose: parsed.data.purpose,
      principleId: parsed.data.principleId ?? null,
      expertiseId: parsed.data.expertiseId ?? null,
    }).returning();
    const [version] = await db.insert(methodVersionsTable).values({
      methodId: method!.id,
      coachId: coach.id,
      version: 1,
      changelog: "Initial draft",
      status: "current",
    }).returning();
    await db.update(methodsTable).set({ currentVersionId: version!.id }).where(eq(methodsTable.id, method!.id));
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "method.create",
      entityType: "method",
      entityId: String(method!.id),
    });
    res.status(201).json({ ...method, currentVersionId: version!.id });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/methods/:id/versions", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ changelog: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const method = await ownMethod(coach.id, Number(req.params.id));
    if (method.currentVersionId) {
      await db.update(methodVersionsTable).set({ status: "archived" }).where(eq(methodVersionsTable.id, method.currentVersionId));
    }
    const existing = await db.select().from(methodVersionsTable).where(eq(methodVersionsTable.methodId, method.id));
    const [version] = await db.insert(methodVersionsTable).values({
      methodId: method.id,
      coachId: coach.id,
      version: existing.length + 1,
      changelog: parsed.data.changelog,
      status: "current",
    }).returning();
    await db.update(methodsTable).set({
      currentVersionId: version!.id,
      status: method.status === "validated" ? "in_test" : method.status,
      commercialEligible: false,
    }).where(eq(methodsTable.id, method.id));
    res.status(201).json(version);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/methods/:id/tests", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      prediction: z.string().default(""),
      evidenceId: z.number(),
      result: z.enum(["pass", "fail", "inconclusive"]),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const method = await ownMethod(coach.id, Number(req.params.id));
    if (!method.currentVersionId) throw new HttpError(409, "INVALID_STATE_TRANSITION", "Method has no current version.");
    const [evidence] = await db.select().from(evidenceTable).where(and(
      eq(evidenceTable.id, parsed.data.evidenceId),
      eq(evidenceTable.coachId, coach.id),
    )).limit(1);
    if (!evidence || evidence.status !== "active") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Test complete requires active evidence.");
    }
    if (parsed.data.result === "pass" && (evidence.kind === "assumption" || evidence.kind === "ai_hypothesis")) {
      throw new HttpError(422, "BUSINESS_RULE", "A passing test cannot rest on assumption or AI hypothesis.");
    }
    const [test] = await db.insert(methodTestsTable).values({
      methodId: method.id,
      versionId: method.currentVersionId,
      coachId: coach.id,
      prediction: parsed.data.prediction,
      result: parsed.data.result,
      evidenceId: evidence.id,
      status: "completed",
      completedAt: new Date(),
    }).returning();
    if (parsed.data.result === "pass") {
      await db.update(methodsTable).set({
        status: "validated",
        commercialEligible: true,
      }).where(eq(methodsTable.id, method.id));
    } else if (parsed.data.result === "fail") {
      await db.update(methodsTable).set({
        status: "in_test",
        commercialEligible: false,
      }).where(eq(methodsTable.id, method.id));
    }
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "METHOD_TESTED",
      entityType: "method",
      entityId: String(method.id),
    });
    res.status(201).json(test);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/methods/:id", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const method = await ownMethod(coach.id, Number(req.params.id));
    res.json(method);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
