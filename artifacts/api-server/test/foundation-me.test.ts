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
} from "@workspace/db";
import router from "../src/routes/index.ts";

type TestRequest = {
  method?: "GET" | "PATCH" | "POST";
  body?: unknown;
  userId?: string;
};

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
    request: async (path: string, options: TestRequest = {}) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
          ...(options.userId ? { "x-test-clerk-user-id": options.userId } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      const text = await response.text();
      return {
        status: response.status,
        body: text ? JSON.parse(text) : null,
      };
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

test("GET /me is authenticated, seeds passport, rejects score writes, and audits passport edits", async () => {
  const testId = randomUUID();
  const aliceId = `foundation-alice-${testId}`;
  const bobId = `foundation-bob-${testId}`;
  const server = await startServer();

  try {
    const anonymous = await server.request("/me");
    assert.equal(anonymous.status, 401);

    const alice = await server.request("/me", { userId: aliceId });
    assert.equal(alice.status, 200);
    assert.equal(alice.body.coach.userId, aliceId);
    assert.equal(typeof alice.body.passport.version, "number");

    const bob = await server.request("/me", { userId: bobId });
    assert.equal(bob.status, 200);
    assert.notEqual(bob.body.coach.id, alice.body.coach.id);

    const scoreWrite = await server.request("/me", {
      method: "PATCH",
      userId: aliceId,
      body: { practiceScore: 99 },
    });
    assert.equal(scoreWrite.status, 403);
    assert.equal(scoreWrite.body.error, "FORBIDDEN");

    const renamed = await server.request("/me", {
      method: "PATCH",
      userId: aliceId,
      body: { name: "Alice Live" },
    });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.coach.name, "Alice Live");

    const passport = await server.request("/me/passport", {
      method: "PATCH",
      userId: aliceId,
      body: { identitySummary: "Alice the coach", developmentFocus: "Questioning" },
    });
    assert.equal(passport.status, 200);
    assert.equal(passport.body.identitySummary, "Alice the coach");
    assert.equal(passport.body.source, "coach_edit");
    assert.ok(passport.body.version >= 2);

    const audit = await server.request("/me/audit", { userId: aliceId });
    assert.equal(audit.status, 200);
    assert.ok(audit.body.some((row: { action: string }) => row.action === "passport.update"));
    assert.ok(audit.body.every((row: { coachId: number }) => row.coachId === alice.body.coach.id));

    const bobAudit = await server.request("/me/audit", { userId: bobId });
    assert.ok(
      !bobAudit.body.some((row: { action: string }) => row.action === "passport.update"),
    );
  } finally {
    await server.close();
    await db.delete(auditLogTable).where(eq(auditLogTable.userId, aliceId));
    await db.delete(auditLogTable).where(eq(auditLogTable.userId, bobId));
    await db.delete(coachPassportsTable).where(eq(coachPassportsTable.userId, aliceId));
    await db.delete(coachPassportsTable).where(eq(coachPassportsTable.userId, bobId));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.userId, aliceId));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.userId, bobId));
  }
});
