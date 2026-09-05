import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  auditLogTable,
  coachPassportsTable,
  coachProfilesTable,
  db,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import {
  HttpError,
  appendAudit,
  ensurePassport,
} from "../lib/coach-foundation.ts";

const router: IRouter = Router();
router.use("/me", requireAuth);

const forbiddenScoreKeys = ["practiceScore", "streak", "practice_score"];

const profilePatchSchema = z.object({
  name: z.string().min(1).optional(),
  niche: z.string().optional(),
  audience: z.string().optional(),
  workingPreferences: z.string().optional(),
  timezone: z.string().optional(),
  capacityMinutesPerDay: z.number().int().min(0).max(24 * 60).optional(),
});

const passportPatchSchema = z.object({
  identitySummary: z.string().optional(),
  specialty: z.string().optional(),
  audience: z.string().optional(),
  experienceSummary: z.string().optional(),
  existingMethodology: z.string().optional(),
  existingClientsNote: z.string().optional(),
  existingContentNote: z.string().optional(),
  existingOffersNote: z.string().optional(),
  confidenceAreas: z.array(z.string()).optional(),
  uncertaintyAreas: z.array(z.string()).optional(),
  developmentFocus: z.string().optional(),
});

function rejectScoreWrites(body: unknown) {
  if (!body || typeof body !== "object") return;
  for (const key of forbiddenScoreKeys) {
    if (key in body) {
      throw new HttpError(
        403,
        "FORBIDDEN",
        "Settings cannot write practice_score or streak.",
        { field: key },
      );
    }
  }
}

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.code,
      message: error.message,
      ...error.extra,
    });
    return;
  }
  throw error;
}

router.get("/me", async (req, res): Promise<void> => {
  try {
    const { coach, passport } = await ensurePassport(authenticatedUserId(req));
    res.json({
      coach: {
        id: coach.id,
        userId: coach.userId,
        name: coach.name,
        niche: coach.niche,
        audience: coach.audience,
        goal: coach.goal,
        developmentFocus: coach.developmentFocus,
        workingPreferences: coach.workingPreferences,
      },
      passport: {
        id: passport.id,
        version: passport.version,
        source: passport.source,
        identitySummary: passport.identitySummary,
        specialty: passport.specialty,
        audience: passport.audience,
        developmentFocus: passport.developmentFocus,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/me", async (req, res): Promise<void> => {
  try {
    rejectScoreWrites(req.body);
    const parsed = profilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [updated] = await db
      .update(coachProfilesTable)
      .set({
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.niche ? { niche: parsed.data.niche } : {}),
        ...(parsed.data.audience ? { audience: parsed.data.audience } : {}),
        ...(parsed.data.workingPreferences
          ? { workingPreferences: parsed.data.workingPreferences }
          : {}),
      })
      .where(eq(coachProfilesTable.id, coach.id))
      .returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "coach.updateProfile",
      entityType: "coach",
      entityId: String(coach.id),
      after: {
        name: updated?.name,
        niche: updated?.niche,
        audience: updated?.audience,
      },
    });
    res.json({ coach: updated });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/passport", async (req, res): Promise<void> => {
  try {
    const { passport } = await ensurePassport(authenticatedUserId(req));
    res.json(passport);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/me/passport", async (req, res): Promise<void> => {
  try {
    rejectScoreWrites(req.body);
    const parsed = passportPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach, passport } = await ensurePassport(userId);
    const [updated] = await db
      .update(coachPassportsTable)
      .set({
        ...parsed.data,
        version: passport.version + 1,
        source: "coach_edit",
      })
      .where(eq(coachPassportsTable.id, passport.id))
      .returning();
    await appendAudit({
      coachId: coach.id,
      userId,
      actorType: "coach",
      action: "passport.update",
      entityType: "passport",
      entityId: String(passport.id),
      before: { version: passport.version },
      after: { version: updated?.version, source: updated?.source },
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/audit", async (req, res): Promise<void> => {
  try {
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const rows = await db
      .select()
      .from(auditLogTable)
      .where(eq(auditLogTable.coachId, coach.id))
      .orderBy(desc(auditLogTable.createdAt))
      .limit(50);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
