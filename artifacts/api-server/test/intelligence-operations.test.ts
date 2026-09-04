import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  db,
  intelligenceAlertStatesTable,
  intelligenceOperationsTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import {
  buildIntelligenceAlerts,
  buildIntelligenceAlertNotification,
  classifyIntelligenceFailure,
  launchOperationalWrites,
} from "../src/lib/intelligence-operation-policy.ts";
import { recordIntelligenceOperation } from "../src/lib/intelligence-operations.ts";

test("persistence failures remain best-effort after successful generation", async () => {
  const attempted: string[] = [];
  const errors: string[] = [];

  launchOperationalWrites(
    [
      {
        name: "prompt audit",
        run: async () => {
          attempted.push("prompt audit");
          throw new Error("database unavailable");
        },
      },
      {
        name: "operations telemetry",
        run: async () => {
          attempted.push("operations telemetry");
        },
      },
    ],
    (name) => errors.push(name),
  );
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(attempted.sort(), ["operations telemetry", "prompt audit"]);
  assert.deepEqual(errors, ["prompt audit"]);
});

test("an unresolved persistence write cannot delay a response", () => {
  let returned = false;
  launchOperationalWrites(
    [
      {
        name: "operations telemetry",
        run: () => new Promise(() => {}),
      },
    ],
    () => assert.fail("an unresolved write must not reject"),
  );
  returned = true;
  assert.equal(returned, true);
});

test("a policy-classifier upstream failure is not a safety block", () => {
  assert.deepEqual(classifyIntelligenceFailure(new Error("request timed out")), {
    outcome: "upstream-error",
    failureClass: "timeout",
  });
});

test("alerts use operation counts without family-breakdown duplication", () => {
  assert.deepEqual(
    buildIntelligenceAlerts({
      total: 6,
      "upstream-error": 3,
      success: 3,
    }).map((alert) => alert.code),
    ["sustained-upstream-failures"],
  );

  assert.deepEqual(
    buildIntelligenceAlerts({
      total: 12,
      "safety-block": 3,
      success: 9,
    }).map((alert) => alert.code),
    ["policy-block-spike"],
  );

  assert.deepEqual(buildIntelligenceAlerts({ total: 0 }), []);
});

test("operational notifications expose only allowlisted neutral metadata", () => {
  const notification = buildIntelligenceAlertNotification(
    {
      code: "sustained-upstream-failures",
      severity: "critical",
      message: "Upstream failures are sustained.",
    },
    true,
    {
      engine: "Practice Simulator",
      strategyVersion: "2026-09",
      strategyFamily: "simulation",
      outcomeCounts: { total: 6, "upstream-error": 3, success: 3 },
      latency: { averageMs: 1200, p95Ms: 2400 },
    },
  );

  assert.deepEqual(Object.keys(notification).sort(), [
    "alert",
    "engine",
    "event",
    "latency",
    "outcomeCounts",
    "strategyFamily",
    "strategyVersion",
  ]);
  assert.equal(JSON.stringify(notification).includes("userId"), false);
  assert.equal(JSON.stringify(notification).includes("prompt"), false);
  assert.equal(notification.event, "triggered");
});

test("recovery notifications use the same metadata allowlist", () => {
  const notification = buildIntelligenceAlertNotification(
    {
      code: "policy-block-spike",
      severity: "warning",
      message: "Policy blocks returned to normal levels.",
    },
    false,
    {
      engine: "Experience to IP",
      strategyVersion: "2026-09",
      strategyFamily: "asset",
      outcomeCounts: { total: 8, "safety-block": 1, success: 7 },
      latency: { averageMs: 800, p95Ms: 1300 },
    },
  );
  assert.equal(notification.event, "recovered");
});

test("database claims deduplicate concurrent alerts and lease interrupted deliveries", async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhookUrl = process.env.INTELLIGENCE_ALERT_WEBHOOK_URL;
  const testId = randomUUID();
  const engine = `claim-test-${testId}`;
  const strategyVersion = `version-${testId}`;
  const strategyFamily = `family-${testId}`;
  const notifications: Array<{ event: string; engine: string }> = [];
  const dimensions = and(
    eq(intelligenceAlertStatesTable.engine, engine),
    eq(intelligenceAlertStatesTable.strategyVersion, strategyVersion),
    eq(intelligenceAlertStatesTable.strategyFamily, strategyFamily),
  );
  const operationDimensions = and(
    eq(intelligenceOperationsTable.engine, engine),
    eq(intelligenceOperationsTable.strategyVersion, strategyVersion),
  );
  const record = (outcome: "success" | "upstream-error") =>
    recordIntelligenceOperation({
      engine,
      outcome,
      startedAt: Date.now(),
      selection: {
        version: strategyVersion,
        engine: "simulation",
        cards: [],
        strategyIds: [],
        families: [strategyFamily],
        sourceClasses: [],
        promptContext: "",
      },
    });

  process.env.INTELLIGENCE_ALERT_WEBHOOK_URL = "https://alerts.test/webhook";
  globalThis.fetch = async (_input, init) => {
    notifications.push(JSON.parse(String(init?.body)));
    return new Response(null, { status: 204 });
  };

  try {
    await record("upstream-error");
    await record("upstream-error");
    await Promise.all([record("upstream-error"), record("upstream-error")]);

    assert.deepEqual(
      notifications.map((notification) => notification.event),
      ["triggered"],
      "concurrent threshold-crossing writes must claim one notification",
    );

    await record("upstream-error");
    assert.equal(
      notifications.length,
      1,
      "an unchanged active state must not notify again",
    );

    await Promise.all(Array.from({ length: 6 }, () => record("success")));
    assert.deepEqual(
      notifications.map((notification) => notification.event),
      ["triggered", "recovered"],
      "returning below the threshold must produce one recovery",
    );

    notifications.length = 0;
    await db.delete(intelligenceOperationsTable).where(operationDimensions);
    await db.delete(intelligenceAlertStatesTable).where(dimensions);
    await db.insert(intelligenceOperationsTable).values(
      Array.from({ length: 3 }, () => ({
        engine,
        strategyVersion,
        strategyFamilies: [strategyFamily],
        outcome: "upstream-error",
        failureClass: "upstream",
        latencyMs: 1,
        chainStages: [],
      })),
    );
    await db.insert(intelligenceAlertStatesTable).values({
      alertCode: "sustained-upstream-failures",
      engine,
      strategyVersion,
      strategyFamily,
      active: true,
      notifiedActive: false,
      notificationActive: true,
      notificationClaimedAt: new Date(),
    });

    await record("upstream-error");
    assert.equal(
      notifications.length,
      0,
      "a delivery claim must remain exclusive while its lease is fresh",
    );

    await db
      .update(intelligenceAlertStatesTable)
      .set({ notificationClaimedAt: new Date(Date.now() - 6 * 60_000) })
      .where(dimensions);
    await record("upstream-error");
    assert.deepEqual(
      notifications.map((notification) => notification.event),
      ["triggered"],
      "an interrupted delivery must become retryable after its lease expires",
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhookUrl === undefined) {
      delete process.env.INTELLIGENCE_ALERT_WEBHOOK_URL;
    } else {
      process.env.INTELLIGENCE_ALERT_WEBHOOK_URL = originalWebhookUrl;
    }
    await db.delete(intelligenceOperationsTable).where(operationDimensions);
    await db.delete(intelligenceAlertStatesTable).where(dimensions);
  }
});