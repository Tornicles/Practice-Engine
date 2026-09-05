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
  db,
  recommendationsTable,
  statisticsTable,
  workflowsTable,
  workflowStepsTable,
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

test("Home overallLevel matches GET /conditions and Today lists accepted ready steps", async () => {
  const userId = `home-${randomUUID()}`;
  const server = await startServer();
  try {
    await server.request("/conditions/recompute", { method: "POST", userId });
    const conditions = await server.request("/conditions", { userId });
    const home = await server.request("/home", { userId });
    const overall = conditions.body.find((row: { subjectType: string }) => row.subjectType === "overall");
    assert.equal(home.body.overallLevel, overall.level);

    const rec = await server.request("/recommendations", {
      method: "POST",
      userId,
      body: { title: "Run one resistance drill" },
    });
    await server.request(`/recommendations/${rec.body.id}/accept`, { method: "POST", userId });
    const today = await server.request("/home/today", { userId });
    assert.equal(today.body.readySteps.length, 1);
    assert.equal(today.body.readySteps[0].name, "Run one resistance drill");
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(workflowStepsTable).where(eq(workflowStepsTable.coachId, coach.id));
      await db.delete(workflowsTable).where(eq(workflowsTable.coachId, coach.id));
      await db.delete(recommendationsTable).where(eq(recommendationsTable.coachId, coach.id));
      await db.delete(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
      await db.delete(statisticsTable).where(eq(statisticsTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
