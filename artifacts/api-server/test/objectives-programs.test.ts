import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  advantagesTable,
  auditLogTable,
  capabilityChecksTable,
  coachPassportsTable,
  coachProfilesTable,
  db,
  focusArenasTable,
  objectivesTable,
  policiesTable,
  programsTable,
  strategyLocksTable,
  targetsTable,
  winningDefinitionsTable,
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

test("Objectives must serve the locked win; Basic programs require purpose-major-primary", async () => {
  const userId = `obj-${randomUUID()}`;
  const server = await startServer();
  try {
    const drafted = await server.request("/strategy", {
      method: "POST",
      userId,
      body: {
        statement: "Reach 20 paying coaching clients in 90 days",
        metric: "paying_clients",
        targetValue: "20",
        unit: "clients",
        deadline: "2026-12-31",
        visibleResult: "20 clients on the roster",
        who: "First-time founder CEOs",
        offer: "12-week decision sprint",
        whereOperates: "Remote US",
        howReach: "LinkedIn",
        exclusions: ["Enterprise retainers"],
        advantages: ["niche"],
        strengths: ["niche specialization"],
        weaknesses: [],
        missing: [],
        verdict: "keep_strategy",
        policy: "No content outside founder coaching.",
      },
    });
    assert.equal(drafted.status, 201);
    const locked = await server.request(`/strategy/${drafted.body.strategyId}/lock`, { method: "POST", userId });
    assert.equal(locked.status, 200);

    const ignored = await server.request("/objectives", {
      method: "POST",
      userId,
      body: { title: "Learn pottery", servesWin: false },
    });
    assert.equal(ignored.status, 201);
    const activateIgnored = await server.request(`/objectives/${ignored.body.id}/activate`, { method: "POST", userId });
    assert.equal(activateIgnored.status, 422);

    const aligned = await server.request("/objectives", {
      method: "POST",
      userId,
      body: { title: "Fill the first ten seats", servesWin: true, role: "primary" },
    });
    assert.equal(aligned.status, 201);
    const activated = await server.request(`/objectives/${aligned.body.id}/activate`, { method: "POST", userId });
    assert.equal(activated.status, 200);
    const doneFromDraft = await server.request(`/objectives/${ignored.body.id}/declare-done`, { method: "POST", userId });
    assert.equal(doneFromDraft.status, 409);

    const program = await server.request("/programs", {
      method: "POST",
      userId,
      body: {
        name: "Founder sprint system",
        purpose: "Build the client engine",
        major: "20 paying clients",
        primary: "Run 12 discovery conversations",
      },
    });
    assert.equal(program.status, 201);
    const activatedProgram = await server.request(`/programs/${program.body.id}/activate`, { method: "POST", userId });
    assert.equal(activatedProgram.status, 200);
    const tree = await server.request(`/programs/${program.body.id}/tree`, { userId });
    assert.equal(tree.status, 200);
    assert.equal(tree.body.targets.length, 3);
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(targetsTable).where(eq(targetsTable.coachId, coach.id));
      await db.delete(programsTable).where(eq(programsTable.coachId, coach.id));
      await db.delete(objectivesTable).where(eq(objectivesTable.coachId, coach.id));
      await db.delete(policiesTable).where(eq(policiesTable.coachId, coach.id));
      await db.delete(capabilityChecksTable).where(eq(capabilityChecksTable.coachId, coach.id));
      await db.delete(advantagesTable).where(eq(advantagesTable.coachId, coach.id));
      await db.delete(focusArenasTable).where(eq(focusArenasTable.coachId, coach.id));
      await db.delete(winningDefinitionsTable).where(eq(winningDefinitionsTable.coachId, coach.id));
      await db.delete(strategyLocksTable).where(eq(strategyLocksTable.coachId, coach.id));
      await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
