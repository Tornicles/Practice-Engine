import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  assessmentAttemptsTable,
  assessmentsTable,
  auditLogTable,
  coachPassportsTable,
  coachProfilesTable,
  db,
  developmentFociTable,
  skillObservationsTable,
  skillStatesTable,
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

test("AI draft scores do not move skill level until accepted; only one focus is active", async () => {
  const userId = `dev-${randomUUID()}`;
  const server = await startServer();
  try {
    const draft = await server.request("/development/observations", {
      method: "POST",
      userId,
      body: { skillKey: "questioning", score: 91, sourceType: "simulation", scoreSource: "ai_draft" },
    });
    assert.equal(draft.status, 201);
    assert.equal(draft.body.state.currentLevel, null);
    assert.equal(draft.body.state.sufficiency, "insufficient");

    const live = await server.request("/development/observations", {
      method: "POST",
      userId,
      body: { skillKey: "questioning", score: 70, sourceType: "practice", scoreSource: "coach" },
    });
    assert.equal(live.status, 201);
    assert.equal(live.body.state.currentLevel, 70);
    assert.equal(live.body.state.sufficiency, "weak");

    const accepted = await server.request(`/development/observations/${draft.body.observation.id}/accept`, {
      method: "POST",
      userId,
    });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.state.currentLevel, 81);

    await server.request("/development/focus", {
      method: "POST",
      userId,
      body: { skillKey: "questioning", reason: "Gap after first live score" },
    });
    await server.request("/development/focus", {
      method: "POST",
      userId,
      body: { skillKey: "listening" },
    });
    const focus = await server.request("/development/focus", { userId });
    assert.equal(focus.body.skillKey, "listening");

    const assessment = await server.request("/development/assessments", {
      method: "POST",
      userId,
      body: { title: "Questioning under resistance", skillKey: "questioning" },
    });
    const aiAttempt = await server.request(`/development/assessments/${assessment.body.id}/attempts`, {
      method: "POST",
      userId,
      body: { score: 99, scoreSource: "ai_draft" },
    });
    assert.equal(aiAttempt.body.status, "draft");
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(assessmentAttemptsTable).where(eq(assessmentAttemptsTable.coachId, coach.id));
      await db.delete(assessmentsTable).where(eq(assessmentsTable.coachId, coach.id));
      await db.delete(skillObservationsTable).where(eq(skillObservationsTable.coachId, coach.id));
      await db.delete(skillStatesTable).where(eq(skillStatesTable.coachId, coach.id));
      await db.delete(developmentFociTable).where(eq(developmentFociTable.coachId, coach.id));
      await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
