import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  clientsTable,
  coachingSessionsTable,
  commitmentsTable,
  db,
  feedbackTable,
  intakesTable,
  outcomesTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";

const router: IRouter = Router();
router.use("/clients", requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

async function ownClient(coachId: number, clientId: number) {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(and(eq(clientsTable.id, clientId), eq(clientsTable.coachId, coachId)))
    .limit(1);
  if (!client) throw new HttpError(404, "NOT_FOUND", "Client not found.");
  return client;
}

router.get("/clients", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const rows = await db.select().from(clientsTable).where(eq(clientsTable.coachId, coach.id)).orderBy(desc(clientsTable.createdAt));
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/clients", async (req, res): Promise<void> => {
  try {
    if (req.body && typeof req.body === "object" && "source" in req.body && req.body.source === "sale") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Sale-sourced clients wait for Batch 10.");
    }
    const parsed = z.object({
      name: z.string().min(1),
      role: z.string().default(""),
      source: z.enum(["manual", "message", "content"]).default("manual"),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [client] = await db.insert(clientsTable).values({
      coachId: coach.id,
      name: parsed.data.name,
      role: parsed.data.role,
      source: parsed.data.source,
      status: "prospect",
    }).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "client.create",
      entityType: "client",
      entityId: String(client!.id),
    });
    res.status(201).json(client);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/clients/:id/intake", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      situation: z.string().default(""),
      goalsStated: z.string().default(""),
      constraints: z.string().default(""),
      skipReason: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const client = await ownClient(coach.id, Number(req.params.id));
    const status = parsed.data.skipReason ? "skipped" : "completed";
    const [intake] = await db.insert(intakesTable).values({
      coachId: coach.id,
      clientId: client.id,
      situation: parsed.data.situation,
      goalsStated: parsed.data.goalsStated,
      constraints: parsed.data.constraints,
      skipReason: parsed.data.skipReason ?? null,
      status,
      completedAt: new Date(),
    }).returning();
    await db.update(clientsTable).set({ status: "active", updatedAt: new Date() }).where(eq(clientsTable.id, client.id));
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "intake.complete",
      entityType: "client",
      entityId: String(client.id),
    });
    res.status(201).json(intake);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/clients/:id/sessions", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const client = await ownClient(coach.id, Number(req.params.id));
    if (client.status === "prospect") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Complete intake before a session.");
    }
    const [session] = await db.insert(coachingSessionsTable).values({
      coachId: coach.id,
      clientId: client.id,
    }).returning();
    res.status(201).json(session);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/sessions/:id/complete", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      notes: z.string().min(1),
      clientResponse: z.string().default(""),
      outcomeNote: z.string().default(""),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [session] = await db
      .select()
      .from(coachingSessionsTable)
      .where(and(eq(coachingSessionsTable.id, Number(req.params.id)), eq(coachingSessionsTable.coachId, coach.id)))
      .limit(1);
    if (!session) throw new HttpError(404, "NOT_FOUND", "Session not found.");
    if (session.status === "completed") {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Session already completed.");
    }
    const [updated] = await db.update(coachingSessionsTable).set({
      status: "completed",
      notes: parsed.data.notes,
      clientResponse: parsed.data.clientResponse,
      outcomeNote: parsed.data.outcomeNote,
      completedAt: new Date(),
    }).where(eq(coachingSessionsTable.id, session.id)).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "session.complete",
      entityType: "session",
      entityId: String(session.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/clients/:id/commitments", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      text: z.string().min(1),
      dueOn: z.string().optional(),
      sessionId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const client = await ownClient(coach.id, Number(req.params.id));
    const [row] = await db.insert(commitmentsTable).values({
      coachId: coach.id,
      clientId: client.id,
      sessionId: parsed.data.sessionId ?? null,
      text: parsed.data.text,
      dueOn: parsed.data.dueOn ?? null,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/commitments/:id/done", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db
      .select()
      .from(commitmentsTable)
      .where(and(eq(commitmentsTable.id, Number(req.params.id)), eq(commitmentsTable.coachId, coach.id)))
      .limit(1);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Commitment not found.");
    const [updated] = await db.update(commitmentsTable).set({
      status: "done",
      verifiedBy: "coach",
    }).where(eq(commitmentsTable.id, row.id)).returning();
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/clients/:id/outcomes", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      kind: z.enum(["baseline", "progress", "final"]).default("progress"),
      stateText: z.string().min(1),
      status: z.enum(["declared"]).default("declared"),
    }).safeParse(req.body);
    if (!parsed.success) {
      if (req.body && typeof req.body === "object" && "status" in req.body && req.body.status === "verified") {
        throw new HttpError(409, "INVALID_STATE_TRANSITION", "Verified outcomes wait for Batch 7.");
      }
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const client = await ownClient(coach.id, Number(req.params.id));
    const [row] = await db.insert(outcomesTable).values({
      coachId: coach.id,
      clientId: client.id,
      kind: parsed.data.kind,
      stateText: parsed.data.stateText,
      status: "declared",
    }).returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "outcome.declare",
      entityType: "outcome",
      entityId: String(row!.id),
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/clients/:id/feedback", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      text: z.string().min(1),
      sentiment: z.enum(["positive", "mixed", "negative", "unknown"]).default("unknown"),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const client = await ownClient(coach.id, Number(req.params.id));
    const [row] = await db.insert(feedbackTable).values({
      coachId: coach.id,
      clientId: client.id,
      text: parsed.data.text,
      sentiment: parsed.data.sentiment,
      source: "coach_note",
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
