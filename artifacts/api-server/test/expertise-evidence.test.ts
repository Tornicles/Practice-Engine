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
  expertiseTable,
  lessonsTable,
  patternInstancesTable,
  patternsTable,
  principlesTable,
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
    request: async (path: string, options: { method?: string; body?: unknown; userId?: string; actor?: string } = {}) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
          ...(options.userId ? { "x-test-clerk-user-id": options.userId } : {}),
          ...(options.actor ? { "x-actor-type": options.actor } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

test("Patterns need two instances and AI cannot validate expertise", async () => {
  const userId = `exp-${randomUUID()}`;
  const server = await startServer();
  try {
    const pattern = await server.request("/patterns", {
      method: "POST",
      userId,
      body: { statement: "Naming the constraint unlocks the decision" },
    });
    const one = await server.request(`/patterns/${pattern.body.id}/instances`, {
      method: "POST",
      userId,
      body: { sourceType: "lesson", sourceId: "1" },
    });
    assert.equal(one.body.status, "proposed");
    const two = await server.request(`/patterns/${pattern.body.id}/instances`, {
      method: "POST",
      userId,
      body: { sourceType: "lesson", sourceId: "2" },
    });
    assert.equal(two.body.status, "accepted");

    const principle = await server.request("/principles", {
      method: "POST",
      userId,
      body: { statement: "Pause before advice", patternId: pattern.body.id },
    });
    const expertise = await server.request("/expertise", {
      method: "POST",
      userId,
      body: { title: "Decision pause", statement: "Name the constraint first", principleId: principle.body.id },
    });
    const tooSoon = await server.request(`/expertise/${expertise.body.id}/validate`, { method: "POST", userId });
    assert.equal(tooSoon.status, 422);

    await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "observation", claim: "Session 1 named the constraint", sourceType: "session", sourceId: "s1" },
    });
    await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "fact", claim: "Client decided the same week", sourceType: "outcome", sourceId: "o1" },
    });
    const ai = await server.request(`/expertise/${expertise.body.id}/validate`, {
      method: "POST",
      userId,
      actor: "ai",
    });
    assert.equal(ai.status, 422);
    const ok = await server.request(`/expertise/${expertise.body.id}/validate`, { method: "POST", userId });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.status, "validated");
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(expertiseTable).where(eq(expertiseTable.coachId, coach.id));
      await db.delete(principlesTable).where(eq(principlesTable.coachId, coach.id));
      await db.delete(patternInstancesTable).where(eq(patternInstancesTable.coachId, coach.id));
      await db.delete(patternsTable).where(eq(patternsTable.coachId, coach.id));
      await db.delete(lessonsTable).where(eq(lessonsTable.coachId, coach.id));
      await db.delete(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
      await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
      await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
