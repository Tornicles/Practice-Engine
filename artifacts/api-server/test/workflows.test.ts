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
  db,
  evidenceTable,
  eventsTable,
  recommendationsTable,
  workflowsTable,
  workflowStepsTable,
  workLimitsTable,
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

test("WIP cap blocks a fourth ready order and steps need evidence", async () => {
  const userId = `wf-${randomUUID()}`;
  const server = await startServer();
  try {
    const recs = [];
    for (const title of ["Practice 1", "Practice 2", "Practice 3", "Practice 4"]) {
      recs.push(await server.request("/recommendations", { method: "POST", userId, body: { title } }));
    }
    const first = await server.request(`/recommendations/${recs[0].body.id}/accept`, { method: "POST", userId });
    const second = await server.request(`/recommendations/${recs[1].body.id}/accept`, { method: "POST", userId });
    const third = await server.request(`/recommendations/${recs[2].body.id}/accept`, { method: "POST", userId });
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(third.status, 201);
    const fourth = await server.request(`/recommendations/${recs[3].body.id}/accept`, { method: "POST", userId });
    assert.equal(fourth.status, 409);
    assert.equal(fourth.body.error, "WORKLOAD_CAP");

    const noEvidence = await server.request(`/workflow-steps/${first.body.step.id}/complete`, {
      method: "POST",
      userId,
      body: {},
    });
    assert.equal(noEvidence.status, 409);

    const evidence = await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "observation", claim: "Completed the drill", sourceType: "practice", sourceId: "p1" },
    });
    const done = await server.request(`/workflow-steps/${first.body.step.id}/complete`, {
      method: "POST",
      userId,
      body: { evidenceId: evidence.body.id },
    });
    assert.equal(done.status, 200);
    assert.equal(done.body.status, "done");
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(workflowStepsTable).where(eq(workflowStepsTable.coachId, coach.id));
      await db.delete(workflowsTable).where(eq(workflowsTable.coachId, coach.id));
      await db.delete(recommendationsTable).where(eq(recommendationsTable.coachId, coach.id));
      await db.delete(workLimitsTable).where(eq(workLimitsTable.coachId, coach.id));
      await db.delete(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
      await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
