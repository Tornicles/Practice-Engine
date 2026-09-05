import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { conditionsTable, db } from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";
import { appendEvent } from "../lib/events.ts";
import { assertAllowedAiOperation, detectIntent } from "../lib/ai-gateway.ts";

const router: IRouter = Router();
router.use("/ai", requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.post("/ai/invoke", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      prompt: z.string().min(1),
      operation: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const detected = detectIntent(parsed.data.prompt);
    const operation = parsed.data.operation ?? detected.intent;
    assertAllowedAiOperation(operation);
    if (detected.forbidden) {
      throw new HttpError(422, "BUSINESS_RULE", "AI cannot validate expertise.");
    }

    const before = await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
    const proposal = {
      kind: "proposal",
      operation,
      engine: detected.engine,
      text: `Proposed next step for: ${parsed.data.prompt.slice(0, 140)}`,
      requiresAcceptance: true,
    };
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "AI_PROPOSAL",
      entityType: "ai",
      entityId: operation,
      actorType: "ai",
    });
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "ai",
      action: "ai.invoke",
      entityType: "proposal",
      entityId: operation,
      after: { operation, engine: detected.engine },
    });
    const after = await db.select().from(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
    res.json({
      proposal,
      conditionsUnchanged: JSON.stringify(before) === JSON.stringify(after),
    });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
