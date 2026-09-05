import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  auditLogTable,
  coachPassportsTable,
  coachProfilesTable,
  db,
  eventsTable,
  evidenceTable,
  methodsTable,
  methodTestsTable,
  methodVersionsTable,
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

test("Passing tests need real evidence; assumption-only pass is rejected", async () => {
  const userId = `method-${randomUUID()}`;
  const server = await startServer();
  try {
    const method = await server.request("/methods", {
      method: "POST",
      userId,
      body: { title: "Decision pause", purpose: "Slow the close" },
    });
    assert.equal(method.status, 201);
    assert.equal(method.body.commercialEligible, false);

    const assumption = await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "assumption", claim: "This should work", sourceType: "note", sourceId: "n1" },
    });
    const bad = await server.request(`/methods/${method.body.id}/tests`, {
      method: "POST",
      userId,
      body: { evidenceId: assumption.body.id, result: "pass" },
    });
    assert.equal(bad.status, 422);

    const fact = await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "observation", claim: "Used in a live session", sourceType: "session", sourceId: "s1" },
    });
    const ok = await server.request(`/methods/${method.body.id}/tests`, {
      method: "POST",
      userId,
      body: { evidenceId: fact.body.id, result: "pass", prediction: "Client names the constraint" },
    });
    assert.equal(ok.status, 201);
    const loaded = await server.request(`/methods/${method.body.id}`, { userId });
    assert.equal(loaded.body.status, "validated");
    assert.equal(loaded.body.commercialEligible, true);
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(methodTestsTable).where(eq(methodTestsTable.coachId, coach.id));
      await db.delete(methodVersionsTable).where(eq(methodVersionsTable.coachId, coach.id));
      await db.delete(methodsTable).where(eq(methodsTable.coachId, coach.id));
      await db.delete(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
      await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
      await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
