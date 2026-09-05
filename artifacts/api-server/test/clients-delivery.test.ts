import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  auditLogTable,
  clientsTable,
  coachingSessionsTable,
  commitmentsTable,
  coachPassportsTable,
  coachProfilesTable,
  db,
  feedbackTable,
  intakesTable,
  outcomesTable,
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

test("Clients reject sale source, require intake before session, and refuse verified outcomes", async () => {
  const userId = `client-${randomUUID()}`;
  const server = await startServer();
  try {
    const sale = await server.request("/clients", {
      method: "POST",
      userId,
      body: { name: "Sold lead", source: "sale" },
    });
    assert.equal(sale.status, 409);

    const created = await server.request("/clients", {
      method: "POST",
      userId,
      body: { name: "Amina" },
    });
    assert.equal(created.status, 201);
    const tooSoon = await server.request(`/clients/${created.body.id}/sessions`, { method: "POST", userId });
    assert.equal(tooSoon.status, 409);

    const intake = await server.request(`/clients/${created.body.id}/intake`, {
      method: "POST",
      userId,
      body: { situation: "Stuck on a hire", goalsStated: "Decide in two weeks" },
    });
    assert.equal(intake.status, 201);

    const session = await server.request(`/clients/${created.body.id}/sessions`, { method: "POST", userId });
    assert.equal(session.status, 201);
    const completed = await server.request(`/sessions/${session.body.id}/complete`, {
      method: "POST",
      userId,
      body: { notes: "Named the real constraint" },
    });
    assert.equal(completed.status, 200);
    const again = await server.request(`/sessions/${session.body.id}/complete`, {
      method: "POST",
      userId,
      body: { notes: "again" },
    });
    assert.equal(again.status, 409);

    const verified = await server.request(`/clients/${created.body.id}/outcomes`, {
      method: "POST",
      userId,
      body: { stateText: "Hired", status: "verified" },
    });
    assert.equal(verified.status, 409);
    const declared = await server.request(`/clients/${created.body.id}/outcomes`, {
      method: "POST",
      userId,
      body: { stateText: "Hired", kind: "final" },
    });
    assert.equal(declared.status, 201);
    assert.equal(declared.body.status, "declared");
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(feedbackTable).where(eq(feedbackTable.coachId, coach.id));
      await db.delete(outcomesTable).where(eq(outcomesTable.coachId, coach.id));
      await db.delete(commitmentsTable).where(eq(commitmentsTable.coachId, coach.id));
      await db.delete(coachingSessionsTable).where(eq(coachingSessionsTable.coachId, coach.id));
      await db.delete(intakesTable).where(eq(intakesTable.coachId, coach.id));
      await db.delete(clientsTable).where(eq(clientsTable.coachId, coach.id));
      await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
