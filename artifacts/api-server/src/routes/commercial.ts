import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  clientsTable,
  contentItemsTable,
  contentSignalsTable,
  db,
  evidenceTable,
  methodsTable,
  offersTable,
  opportunitiesTable,
  proofItemsTable,
  prospectsTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";
import { appendEvent } from "../lib/events.ts";

const router: IRouter = Router();
router.use(requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.post("/content", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ title: z.string().min(3), kind: z.string().default("post") }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(contentItemsTable).values({
      coachId: coach.id,
      title: parsed.data.title,
      kind: parsed.data.kind,
      status: "ready",
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/content/:id/publish", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [item] = await db.select().from(contentItemsTable).where(and(
      eq(contentItemsTable.id, Number(req.params.id)),
      eq(contentItemsTable.coachId, coach.id),
    )).limit(1);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Content not found.");
    const [updated] = await db.update(contentItemsTable).set({
      status: "published",
      publishedAt: new Date(),
    }).where(eq(contentItemsTable.id, item.id)).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "CONTENT_PUBLISHED",
      entityType: "content",
      entityId: String(item.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/content/:id/signals", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      kind: z.enum(["view", "like", "message", "booking", "return", "commit", "sale"]),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const countsAsSignal = !["view", "like"].includes(parsed.data.kind);
    const [row] = await db.insert(contentSignalsTable).values({
      coachId: coach.id,
      contentId: Number(req.params.id),
      kind: parsed.data.kind,
      countsAsSignal,
    }).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: countsAsSignal ? "CONTENT_SIGNAL" : "CONTENT_VIEWED",
      entityType: "content",
      entityId: String(req.params.id),
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/proof", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ claim: z.string().min(3), evidenceId: z.number() }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [evidence] = await db.select().from(evidenceTable).where(and(
      eq(evidenceTable.id, parsed.data.evidenceId),
      eq(evidenceTable.coachId, coach.id),
    )).limit(1);
    if (!evidence || (evidence.kind !== "fact" && evidence.kind !== "observation")) {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Proof.earned requires fact or observation evidence.");
    }
    const [row] = await db.insert(proofItemsTable).values({
      coachId: coach.id,
      claim: parsed.data.claim,
      evidenceId: evidence.id,
      status: "earned",
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/offers", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      name: z.string().min(3),
      promise: z.string().default(""),
      methodId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [row] = await db.insert(offersTable).values({
      coachId: coach.id,
      name: parsed.data.name,
      promise: parsed.data.promise,
      methodId: parsed.data.methodId ?? null,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/offers/:id/activate", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [offer] = await db.select().from(offersTable).where(and(
      eq(offersTable.id, Number(req.params.id)),
      eq(offersTable.coachId, coach.id),
    )).limit(1);
    if (!offer) throw new HttpError(404, "NOT_FOUND", "Offer not found.");
    if (offer.methodId) {
      const [method] = await db.select().from(methodsTable).where(eq(methodsTable.id, offer.methodId)).limit(1);
      if (!method || !method.commercialEligible) {
        throw new HttpError(409, "INVALID_STATE_TRANSITION", "Offer cannot activate on an ineligible method.");
      }
    }
    const [updated] = await db.update(offersTable).set({
      status: "active",
      commercialGatePassed: true,
    }).where(eq(offersTable.id, offer.id)).returning();
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/opportunities", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      prospectName: z.string().min(1),
      offerId: z.number(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [offer] = await db.select().from(offersTable).where(and(
      eq(offersTable.id, parsed.data.offerId),
      eq(offersTable.coachId, coach.id),
    )).limit(1);
    if (!offer) throw new HttpError(404, "NOT_FOUND", "Offer not found.");
    const [prospect] = await db.insert(prospectsTable).values({
      coachId: coach.id,
      name: parsed.data.prospectName,
    }).returning();
    const [opportunity] = await db.insert(opportunitiesTable).values({
      coachId: coach.id,
      prospectId: prospect!.id,
      offerId: offer.id,
    }).returning();
    res.status(201).json(opportunity);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/opportunities/:id/win", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [opportunity] = await db.select().from(opportunitiesTable).where(and(
      eq(opportunitiesTable.id, Number(req.params.id)),
      eq(opportunitiesTable.coachId, coach.id),
    )).limit(1);
    if (!opportunity) throw new HttpError(404, "NOT_FOUND", "Opportunity not found.");
    if (!opportunity.offerId) throw new HttpError(400, "VALIDATION", "Win requires an offer.");
    const result = await db.transaction(async (tx) => {
      const [prospect] = await tx.select().from(prospectsTable).where(eq(prospectsTable.id, opportunity.prospectId));
      const [client] = await tx.insert(clientsTable).values({
        coachId: coach.id,
        name: prospect?.name ?? "New client",
        source: "sale",
        status: "new",
        relatedOpportunityId: opportunity.id,
      }).returning();
      const [updated] = await tx.update(opportunitiesTable).set({
        status: "won",
        clientId: client!.id,
      }).where(eq(opportunitiesTable.id, opportunity.id)).returning();
      await tx.update(prospectsTable).set({ clientId: client!.id, status: "qualified" }).where(eq(prospectsTable.id, opportunity.prospectId));
      return { opportunity: updated, client };
    });
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "SALE_WON",
      entityType: "opportunity",
      entityId: String(opportunity.id),
    });
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "CLIENT_CREATED",
      entityType: "client",
      entityId: String(result.client!.id),
    });
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "opportunity.win",
      entityType: "client",
      entityId: String(result.client!.id),
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
