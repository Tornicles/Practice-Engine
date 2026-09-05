import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, programsTable, strategyLocksTable, targetsTable } from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";

const router: IRouter = Router();
router.use("/programs", requireAuth);

const createSchema = z.object({
  name: z.string().min(3),
  domain: z.enum(["development", "client", "content", "commercial", "product", "operations"]).default("development"),
  purpose: z.string().min(1),
  tier: z.enum(["basic", "advanced", "premium"]).default("basic"),
  major: z.string().min(1),
  primary: z.string().min(1),
});

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.post("/programs", async (req, res): Promise<void> => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [active] = await db
      .select()
      .from(strategyLocksTable)
      .where(and(eq(strategyLocksTable.coachId, coach.id), eq(strategyLocksTable.status, "active")))
      .limit(1);
    const [program] = await db.insert(programsTable).values({
      coachId: coach.id,
      strategyId: active?.id ?? null,
      name: parsed.data.name,
      domain: parsed.data.domain,
      purpose: parsed.data.purpose,
      tier: parsed.data.tier,
    }).returning();
    const [purpose] = await db.insert(targetsTable).values({
      coachId: coach.id,
      programId: program!.id,
      level: "purpose",
      title: parsed.data.purpose,
    }).returning();
    const [major] = await db.insert(targetsTable).values({
      coachId: coach.id,
      programId: program!.id,
      parentTargetId: purpose!.id,
      level: "major",
      title: parsed.data.major,
    }).returning();
    await db.insert(targetsTable).values({
      coachId: coach.id,
      programId: program!.id,
      parentTargetId: major!.id,
      level: "primary",
      title: parsed.data.primary,
    });
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "program.create",
      entityType: "program",
      entityId: String(program!.id),
    });
    res.status(201).json(program);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/programs/:id/activate", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const id = Number(req.params.id);
    const [program] = await db
      .select()
      .from(programsTable)
      .where(and(eq(programsTable.id, id), eq(programsTable.coachId, coach.id)))
      .limit(1);
    if (!program) throw new HttpError(404, "NOT_FOUND", "Program not found.");
    const targets = await db.select().from(targetsTable).where(eq(targetsTable.programId, program.id));
    const levels = new Set(targets.map((row) => row.level));
    if (!levels.has("purpose") || !levels.has("major") || !levels.has("primary")) {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Basic program requires purpose, major, and primary targets.");
    }
    if (program.tier !== "basic") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Advanced and Premium activation is not implemented yet.");
    }
    const [updated] = await db.update(programsTable).set({ status: "active" }).where(eq(programsTable.id, program.id)).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "program.activate",
      entityType: "program",
      entityId: String(program.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/programs/:id/tree", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const id = Number(req.params.id);
    const [program] = await db
      .select()
      .from(programsTable)
      .where(and(eq(programsTable.id, id), eq(programsTable.coachId, coach.id)))
      .limit(1);
    if (!program) throw new HttpError(404, "NOT_FOUND", "Program not found.");
    const targets = await db.select().from(targetsTable).where(eq(targetsTable.programId, program.id));
    res.json({ program, targets });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
