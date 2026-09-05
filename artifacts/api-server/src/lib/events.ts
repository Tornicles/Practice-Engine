import { eventsTable, db } from "@workspace/db";

export async function appendEvent(input: {
  coachId: number;
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  actorType?: "coach" | "system" | "ai";
  idempotencyKey?: string | null;
}) {
  const [row] = await db.insert(eventsTable).values({
    coachId: input.coachId,
    userId: input.userId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? {},
    actorType: input.actorType ?? "coach",
    idempotencyKey: input.idempotencyKey ?? null,
  }).returning();
  return row;
}
