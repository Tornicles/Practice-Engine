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
  clientsTable,
  coachingSessionsTable,
  coachPassportsTable,
  coachProfilesTable,
  conditionsTable,
  contentItemsTable,
  contentSignalsTable,
  db,
  eventsTable,
  evidenceTable,
  expertiseTable,
  focusArenasTable,
  intakesTable,
  methodsTable,
  methodTestsTable,
  methodVersionsTable,
  offersTable,
  opportunitiesTable,
  patternsTable,
  patternInstancesTable,
  policiesTable,
  principlesTable,
  prospectsTable,
  recommendationsTable,
  skillObservationsTable,
  skillStatesTable,
  statisticsTable,
  strategyLocksTable,
  winningDefinitionsTable,
  workLimitsTable,
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

test("Golden path: lock, practice, client, expertise, method, signal, sale, client new", async () => {
  const userId = `gold-${randomUUID()}`;
  const server = await startServer();
  try {
    const draft = await server.request("/strategy", {
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
    assert.equal(draft.status, 201);
    const locked = await server.request(`/strategy/${draft.body.strategyId}/lock`, { method: "POST", userId });
    assert.equal(locked.status, 200);

    const practice = await server.request("/development/observations", {
      method: "POST",
      userId,
      body: { skillKey: "questioning", score: 68, sourceType: "practice", scoreSource: "coach" },
    });
    assert.equal(practice.status, 201);

    const rec = await server.request("/recommendations", {
      method: "POST",
      userId,
      body: { title: "Run one resistance drill", area: "development" },
    });
    const accepted = await server.request(`/recommendations/${rec.body.id}/accept`, { method: "POST", userId });
    assert.equal(accepted.status, 201);

    const evidenceA = await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "observation", claim: "Named the constraint in practice", sourceType: "practice", sourceId: "p1" },
    });
    const stepDone = await server.request(`/workflow-steps/${accepted.body.step.id}/complete`, {
      method: "POST",
      userId,
      body: { evidenceId: evidenceA.body.id },
    });
    assert.equal(stepDone.status, 200);

    const client = await server.request("/clients", { method: "POST", userId, body: { name: "Amina" } });
    await server.request(`/clients/${client.body.id}/intake`, {
      method: "POST",
      userId,
      body: { situation: "Stuck on a hire", goalsStated: "Decide in two weeks" },
    });
    const session = await server.request(`/clients/${client.body.id}/sessions`, { method: "POST", userId });
    const completed = await server.request(`/sessions/${session.body.id}/complete`, {
      method: "POST",
      userId,
      body: { notes: "Named the constraint" },
    });
    assert.equal(completed.status, 200);

    const evidenceB = await server.request("/evidence", {
      method: "POST",
      userId,
      body: { kind: "fact", claim: "Client booked the next session", sourceType: "session", sourceId: String(session.body.id) },
    });
    const pattern = await server.request("/patterns", {
      method: "POST",
      userId,
      body: { statement: "Naming the constraint unlocks the decision" },
    });
    await server.request(`/patterns/${pattern.body.id}/instances`, {
      method: "POST",
      userId,
      body: { sourceType: "session", sourceId: "1" },
    });
    await server.request(`/patterns/${pattern.body.id}/instances`, {
      method: "POST",
      userId,
      body: { sourceType: "session", sourceId: "2" },
    });
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
    const validated = await server.request(`/expertise/${expertise.body.id}/validate`, { method: "POST", userId });
    assert.equal(validated.status, 200);

    const method = await server.request("/methods", {
      method: "POST",
      userId,
      body: { title: "Decision pause", expertiseId: expertise.body.id },
    });
    const tested = await server.request(`/methods/${method.body.id}/tests`, {
      method: "POST",
      userId,
      body: { evidenceId: evidenceB.body.id, result: "pass" },
    });
    assert.equal(tested.status, 201);
    const loaded = await server.request(`/methods/${method.body.id}`, { userId });
    assert.equal(loaded.body.commercialEligible, true);

    const content = await server.request("/content", { method: "POST", userId, body: { title: "Founder stall" } });
    await server.request(`/content/${content.body.id}/publish`, { method: "POST", userId });
    const signal = await server.request(`/content/${content.body.id}/signals`, {
      method: "POST",
      userId,
      body: { kind: "booking" },
    });
    assert.equal(signal.body.countsAsSignal, true);

    const offer = await server.request("/offers", {
      method: "POST",
      userId,
      body: { name: "12-week sprint", methodId: method.body.id },
    });
    const active = await server.request(`/offers/${offer.body.id}/activate`, { method: "POST", userId });
    assert.equal(active.status, 200);
    const opportunity = await server.request("/opportunities", {
      method: "POST",
      userId,
      body: { prospectName: "Jordan", offerId: offer.body.id },
    });
    const won = await server.request(`/opportunities/${opportunity.body.id}/win`, { method: "POST", userId });
    assert.equal(won.status, 200);
    assert.equal(won.body.client.source, "sale");
    assert.equal(won.body.client.status, "new");

    await server.request("/conditions/recompute", { method: "POST", userId });
    const home = await server.request("/home", { userId });
    const conditions = await server.request("/conditions", { userId });
    const overall = conditions.body.find((row: { subjectType: string }) => row.subjectType === "overall");
    assert.equal(home.body.overallLevel, overall.level);
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (!coach) return;
    await db.delete(opportunitiesTable).where(eq(opportunitiesTable.coachId, coach.id));
    await db.delete(prospectsTable).where(eq(prospectsTable.coachId, coach.id));
    await db.delete(offersTable).where(eq(offersTable.coachId, coach.id));
    await db.delete(contentSignalsTable).where(eq(contentSignalsTable.coachId, coach.id));
    await db.delete(contentItemsTable).where(eq(contentItemsTable.coachId, coach.id));
    await db.delete(coachingSessionsTable).where(eq(coachingSessionsTable.coachId, coach.id));
    await db.delete(intakesTable).where(eq(intakesTable.coachId, coach.id));
    await db.delete(clientsTable).where(eq(clientsTable.coachId, coach.id));
    await db.delete(methodTestsTable).where(eq(methodTestsTable.coachId, coach.id));
    await db.delete(methodVersionsTable).where(eq(methodVersionsTable.coachId, coach.id));
    await db.delete(methodsTable).where(eq(methodsTable.coachId, coach.id));
    await db.delete(expertiseTable).where(eq(expertiseTable.coachId, coach.id));
    await db.delete(principlesTable).where(eq(principlesTable.coachId, coach.id));
    await db.delete(patternInstancesTable).where(eq(patternInstancesTable.coachId, coach.id));
    await db.delete(patternsTable).where(eq(patternsTable.coachId, coach.id));
    await db.delete(workflowStepsTable).where(eq(workflowStepsTable.coachId, coach.id));
    await db.delete(workflowsTable).where(eq(workflowsTable.coachId, coach.id));
    await db.delete(recommendationsTable).where(eq(recommendationsTable.coachId, coach.id));
    await db.delete(workLimitsTable).where(eq(workLimitsTable.coachId, coach.id));
    await db.delete(skillObservationsTable).where(eq(skillObservationsTable.coachId, coach.id));
    await db.delete(skillStatesTable).where(eq(skillStatesTable.coachId, coach.id));
    await db.delete(policiesTable).where(eq(policiesTable.coachId, coach.id));
    await db.delete(capabilityChecksTable).where(eq(capabilityChecksTable.coachId, coach.id));
    await db.delete(advantagesTable).where(eq(advantagesTable.coachId, coach.id));
    await db.delete(focusArenasTable).where(eq(focusArenasTable.coachId, coach.id));
    await db.delete(winningDefinitionsTable).where(eq(winningDefinitionsTable.coachId, coach.id));
    await db.delete(strategyLocksTable).where(eq(strategyLocksTable.coachId, coach.id));
    await db.delete(evidenceTable).where(eq(evidenceTable.coachId, coach.id));
    await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
    await db.delete(conditionsTable).where(eq(conditionsTable.coachId, coach.id));
    await db.delete(statisticsTable).where(eq(statisticsTable.coachId, coach.id));
    await db.delete(auditLogTable).where(eq(auditLogTable.coachId, coach.id));
    await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
  }
});
