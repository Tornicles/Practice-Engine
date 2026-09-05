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
  policiesTable,
  strategyLocksTable,
  winningDefinitionsTable,
} from "@workspace/db";
import router from "../src/routes/index.ts";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-clerk-user-id");
    const auth = Object.assign(
      () => ({
        tokenType: "session_token" as const,
        userId: userId ?? null,
        sessionClaims: userId ? { userId } : null,
      }),
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

const validDraft = {
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
  exclusions: ["Enterprise transformation retainers"],
  advantages: ["niche"],
  strengths: ["niche specialization with founders"],
  weaknesses: ["video production"],
  missing: [],
  verdict: "keep_strategy",
  policy: "No content outside first-time founder coaching.",
};

test("Strategy draft rejects compound wins and lock refuses adjust_strategy", async () => {
  const testId = randomUUID();
  const userId = `strategy-${testId}`;
  const server = await startServer();
  try {
    const compound = await server.request("/strategy", {
      method: "POST",
      userId,
      body: {
        ...validDraft,
        statement: "Grow YouTube and start a SaaS and learn coding",
      },
    });
    assert.equal(compound.status, 400);

    const drafted = await server.request("/strategy", {
      method: "POST",
      userId,
      body: { ...validDraft, verdict: "adjust_strategy" },
    });
    assert.equal(drafted.status, 201);
    const lock = await server.request(`/strategy/${drafted.body.strategyId}/lock`, {
      method: "POST",
      userId,
    });
    assert.equal(lock.status, 409);

    const ready = await server.request("/strategy", {
      method: "POST",
      userId,
      body: validDraft,
    });
    assert.equal(ready.status, 201);
    const locked = await server.request(`/strategy/${ready.body.strategyId}/lock`, {
      method: "POST",
      userId,
    });
    assert.equal(locked.status, 200);
    assert.equal(locked.body.status, "active");

    await server.request("/me/close", { method: "POST", userId });
    const afterClose = await server.request("/me/passport", {
      method: "PATCH",
      userId,
      body: { identitySummary: "nope" },
    });
    assert.equal(afterClose.status, 409);
  } finally {
    await server.close();
    await db.delete(advantagesTable).where(eq(advantagesTable.coachId, (
      await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId))
    )[0]?.id ?? -1));
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(policiesTable).where(eq(policiesTable.coachId, coach.id));
      await db.delete(capabilityChecksTable).where(eq(capabilityChecksTable.coachId, coach.id));
      await db.delete(focusArenasTable).where(eq(focusArenasTable.coachId, coach.id));
      await db.delete(winningDefinitionsTable).where(eq(winningDefinitionsTable.coachId, coach.id));
      await db.delete(strategyLocksTable).where(eq(strategyLocksTable.coachId, coach.id));
      await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
