import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  clientsTable,
  coachPassportsTable,
  coachProfilesTable,
  contentItemsTable,
  contentSignalsTable,
  db,
  evidenceTable,
  eventsTable,
  methodsTable,
  methodTestsTable,
  methodVersionsTable,
  offersTable,
  opportunitiesTable,
  prospectsTable,
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

test("Draft methods cannot activate offers; a win creates a sale client in status new", async () => {
  const userId = `com-${randomUUID()}`;
  const server = await startServer();
  try {
    const method = await server.request("/methods", {
      method: "POST",
      userId,
      body: { title: "Decision pause" },
    });
    const blockedOffer = await server.request("/offers", {
      method: "POST",
      userId,
      body: { name: "Sprint", methodId: method.body.id },
    });
    const blocked = await server.request(`/offers/${blockedOffer.body.id}/activate`, { method: "POST", userId });
    assert.equal(blocked.status, 409);

    const evidence = await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "observation", claim: "Worked live", sourceType: "session", sourceId: "s1" },
    });
    await server.request(`/methods/${method.body.id}/tests`, {
      method: "POST",
      userId,
      body: { evidenceId: evidence.body.id, result: "pass" },
    });
    const activated = await server.request(`/offers/${blockedOffer.body.id}/activate`, { method: "POST", userId });
    assert.equal(activated.status, 200);

    const view = await server.request("/content", { method: "POST", userId, body: { title: "Founder stall" } });
    await server.request(`/content/${view.body.id}/publish`, { method: "POST", userId });
    const signal = await server.request(`/content/${view.body.id}/signals`, {
      method: "POST",
      userId,
      body: { kind: "view" },
    });
    assert.equal(signal.body.countsAsSignal, false);

    const opportunity = await server.request("/opportunities", {
      method: "POST",
      userId,
      body: { prospectName: "Jordan", offerId: blockedOffer.body.id },
    });
    const won = await server.request(`/opportunities/${opportunity.body.id}/win`, { method: "POST", userId });
    assert.equal(won.status, 200);
    assert.equal(won.body.client.source, "sale");
    assert.equal(won.body.client.status, "new");
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(opportunitiesTable).where(eq(opportunitiesTable.coachId, coach.id));
      await db.delete(prospectsTable).where(eq(prospectsTable.coachId, coach.id));
      await db.delete(offersTable).where(eq(offersTable.coachId, coach.id));
      await db.delete(contentSignalsTable).where(eq(contentSignalsTable.coachId, coach.id));
      await db.delete(contentItemsTable).where(eq(contentItemsTable.coachId, coach.id));
      await db.delete(clientsTable).where(eq(clientsTable.coachId, coach.id));
      await db.delete(methodTestsTable).where(eq(methodTestsTable.coachId, coach.id));
      await db.delete(methodVersionsTable).where(eq(methodVersionsTable.coachId, coach.id));
      await db.delete(methodsTable).where(eq(methodsTable.coachId, coach.id));
      await db.delete(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
      await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
