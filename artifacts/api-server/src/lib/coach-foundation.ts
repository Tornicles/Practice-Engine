import { eq } from "drizzle-orm";
import {
  auditLogTable,
  coachPassportsTable,
  coachProfilesTable,
  db,
} from "@workspace/db";

export class HttpError extends Error {
  public status: number;
  public code: string;
  public extra: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export async function ensureCoach(userId: string) {
  const [existing] = await db
    .select()
    .from(coachProfilesTable)
    .where(eq(coachProfilesTable.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(coachProfilesTable)
    .values({
      userId,
      name: "Coach",
      niche: "Leadership & Business Coaching",
      experienceLevel: "Developing coach",
      audience: "Growth-stage leaders",
      goal: "Become a better coach",
      developmentFocus: "Questioning under resistance",
    })
    .onConflictDoNothing({ target: coachProfilesTable.userId })
    .returning();
  if (created) return created;

  const [again] = await db
    .select()
    .from(coachProfilesTable)
    .where(eq(coachProfilesTable.userId, userId))
    .limit(1);
  if (!again) throw new HttpError(500, "INTERNAL", "Unable to provision the coach.");
  return again;
}

export async function ensurePassport(userId: string) {
  const coach = await ensureCoach(userId);
  const [existing] = await db
    .select()
    .from(coachPassportsTable)
    .where(eq(coachPassportsTable.coachId, coach.id))
    .limit(1);
  if (existing) return { coach, passport: existing };

  const [created] = await db
    .insert(coachPassportsTable)
    .values({
      coachId: coach.id,
      userId,
      identitySummary: coach.name,
      specialty: coach.niche,
      audience: coach.audience,
      experienceSummary: coach.experienceLevel,
      developmentFocus: coach.developmentFocus,
      source: "onboarding",
    })
    .onConflictDoNothing({ target: coachPassportsTable.coachId })
    .returning();
  if (created) return { coach, passport: created };

  const [again] = await db
    .select()
    .from(coachPassportsTable)
    .where(eq(coachPassportsTable.coachId, coach.id))
    .limit(1);
  if (!again) throw new HttpError(500, "INTERNAL", "Unable to provision the passport.");
  return { coach, passport: again };
}

export async function appendAudit(input: {
  coachId?: number | null;
  userId?: string | null;
  actorType: "coach" | "operator" | "system" | "ai";
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
}) {
  await db.insert(auditLogTable).values({
    coachId: input.coachId ?? null,
    userId: input.userId ?? null,
    actorType: input.actorType,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  });
}
