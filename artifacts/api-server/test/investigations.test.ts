import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  coachPassportsTable,
  coachProfilesTable,
  conditionsTable,
  correctionsTable,
  db,
  evidenceTable,
  eventsTable,
  investigationsTable,
  resetItemsTable,
} from "@workspace/db";
import router from "../src/routes/index.ts";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-clerk-user-id");
    const auth = Object.assign(
      () => ({ tokenType: "session_token" as const, userId: userId ?? null, sessionClaims: userId ? { userId } : null }),
      { [Symbol.for("@clerk/express.auth")]: true },
    );
    (req as Request & { auth: typeof auth }).auth = auth;
    next();
  });
  app.use(router);
  return app;
}

async function startServer() {
  const server = createServer(createApp());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;
  return {
    request: async (path: string, options: { method?: string; body?: unknown; userId?: string } = {}) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
          ...(options.userId ? { "x-test-clerk-user-id": options.userId } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

test("Insufficient Evidence cannot open a case; verify without measurement fails; reset keeps evidence", async () => {
  const userId = `inv-${randomUUID()}`;
  const server = await startServer();
  try {
    const computed = await server.request("/conditions/recompute", { method: "POST", userId });
    const overall = computed.body.find((row: { subjectType: string }) => row.subjectType === "overall");
    const blocked = await server.request("/investigations", {
      method: "POST",
      userId,
      body: { problem: "Guessing a decline", conditionId: overall.id },
    });
    assert.equal(blocked.status, 409);

    const caseRow = await server.request("/investigations", {
      method: "POST",
      userId,
      body: { problem: "Delivery stall after three no-shows" },
    });
    assert.equal(caseRow.status, 201);
    const correction = await server.request(`/investigations/${caseRow.body.id}/corrections`, {
      method: "POST",
      userId,
      body: { actionStatement: "Rebook follow-ups same day", metric: "event_count", targetValue: "3" },
    });
    await server.request(`/corrections/${correction.body.id}/execute`, { method: "POST", userId });
    const verify = await server.request(`/corrections/${correction.body.id}/verify`, { method: "POST", userId });
    assert.equal(verify.status, 409);

    await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "observation", claim: "Kept for reset", sourceType: "session", sourceId: "s1" },
    });
    const item = await server.request("/reset/items", {
      method: "POST",
      userId,
      body: { itemType: "program", itemId: "p1", decay: true },
    });
    const applied = await server.request(`/reset/items/${item.body.id}/apply`, {
      method: "POST",
      userId,
      body: { fate: "end" },
    });
    assert.equal(applied.status, 200);
    assert.ok(applied.body.evidenceRemaining >= 1);
    assert.ok(applied.body.eventsRemaining >= 1);
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(resetItemsTable).where(eq(resetItemsTable.coachId, coach.id));
      await db.delete(correctionsTable).where(eq(correctionsTable.coachId, coach.id));
      await db.delete(investigationsTable).where(eq(investigationsTable.coachId, coach.id));
      await db.delete(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
      await db.delete(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
      await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
