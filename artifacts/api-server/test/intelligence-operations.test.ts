import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  db,
  intelligenceAlertStatesTable,
  intelligenceOperationDailyRollupsTable,
  intelligenceOperationsTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import {
  buildIntelligenceAlerts,
  buildIntelligenceAlertNotification,
  classifyIntelligenceFailure,
  launchOperationalWrites,
} from "../src/lib/intelligence-operation-policy.ts";
import {
  compactIntelligenceOperations,
  recordIntelligenceOperation,
  reportIntelligenceOperations,
} from "../src/lib/intelligence-operations.ts";

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
  const testId = randomUUID();
  const engine = `claim-test-${testId}`;
  const strategyVersion = `version-${testId}`;
  const strategyFamily = `family-${testId}`;
  const notifications: Array<{ event: string; engine: string }> = [];
  const alertDelivery = {
    webhookUrl: "https://alerts.test/webhook",
    httpSender: async (_input: string | URL | Request, init?: RequestInit) => {
      notifications.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: 204 });
    },
  };
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
    recordIntelligenceOperation(
      {
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
      },
      alertDelivery,
    );

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
    await db.delete(intelligenceOperationsTable).where(operationDimensions);
    await db.delete(intelligenceAlertStatesTable).where(dimensions);
  }
});

test("timed-out alert delivery releases its claim and retries once on later telemetry", async () => {
  const testId = randomUUID();
  const engine = `failed-delivery-test-${testId}`;
  const strategyVersion = `version-${testId}`;
  const strategyFamily = `family-${testId}`;
  const dimensions = and(
    eq(
      intelligenceAlertStatesTable.alertCode,
      "sustained-upstream-failures",
    ),
    eq(intelligenceAlertStatesTable.engine, engine),
    eq(intelligenceAlertStatesTable.strategyVersion, strategyVersion),
    eq(intelligenceAlertStatesTable.strategyFamily, strategyFamily),
  );
  const operationDimensions = and(
    eq(intelligenceOperationsTable.engine, engine),
    eq(intelligenceOperationsTable.strategyVersion, strategyVersion),
  );
  const notifications: Array<{ event: string }> = [];
  let attempts = 0;
  const alertDelivery = {
    webhookUrl: "https://alerts.test/webhook",
    httpSender: async (_input: string | URL | Request, init?: RequestInit) => {
      attempts += 1;
      if (attempts === 1) {
        throw new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError",
        );
      }
      notifications.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: 204 });
    },
  };
  const record = () =>
    recordIntelligenceOperation(
      {
        engine,
        outcome: "upstream-error",
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
      },
      alertDelivery,
    );

  try {
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

    await assert.rejects(record(), {
      name: "TimeoutError",
      message: "The operation was aborted due to timeout",
    });

    let [state] = await db
      .select()
      .from(intelligenceAlertStatesTable)
      .where(dimensions);
    assert.equal(state?.active, true);
    assert.equal(state?.notifiedActive, false);
    assert.equal(state?.notificationActive, null);
    assert.equal(state?.notificationClaimedAt, null);

    await record();

    assert.equal(attempts, 2);
    assert.deepEqual(
      notifications.map((notification) => notification.event),
      ["triggered"],
      "the retry must deliver the pending transition exactly once",
    );

    [state] = await db
      .select()
      .from(intelligenceAlertStatesTable)
      .where(dimensions);
    assert.equal(state?.active, true);
    assert.equal(state?.notifiedActive, true);
    assert.equal(state?.notificationActive, null);
    assert.equal(state?.notificationClaimedAt, null);
  } finally {
    await db.delete(intelligenceOperationsTable).where(operationDimensions);
    await db.delete(intelligenceAlertStatesTable).where(dimensions);
  }
});

test("UTC retention compaction and long-window reports have no boundary gap or overlap", async () => {
  const testId = randomUUID();
  const engine = `retention-test-${testId}`;
  const strategyVersion = `version-${testId}`;
  const strategyFamily = `family-${testId}`;
  const operationDimensions = and(
    eq(intelligenceOperationsTable.engine, engine),
    eq(intelligenceOperationsTable.strategyVersion, strategyVersion),
  );
  const rollupDimensions = and(
    eq(intelligenceOperationDailyRollupsTable.engine, engine),
    eq(
      intelligenceOperationDailyRollupsTable.strategyVersion,
      strategyVersion,
    ),
  );

  try {
    await db.execute(sql`
      insert into intelligence_operations (
        engine,
        strategy_version,
        strategy_families,
        outcome,
        failure_class,
        latency_ms,
        chain_stages,
        created_at
      )
      values
        (
          ${engine}, ${strategyVersion}, ${JSON.stringify([strategyFamily])}::jsonb,
          'success', null, 100, '[]'::jsonb,
          date_trunc('day', (now() at time zone 'UTC') - interval '7 days')
            at time zone 'UTC' - interval '2 hours'
        ),
        (
          ${engine}, ${strategyVersion}, ${JSON.stringify([strategyFamily])}::jsonb,
          'success', null, 300, '[]'::jsonb,
          date_trunc('day', (now() at time zone 'UTC') - interval '7 days')
            at time zone 'UTC' - interval '1 hour'
        ),
        (
          ${engine}, ${strategyVersion}, ${JSON.stringify([strategyFamily])}::jsonb,
          'success', null, 500, '[]'::jsonb,
          date_trunc('day', (now() at time zone 'UTC') - interval '7 days')
            at time zone 'UTC'
        ),
        (
          ${engine}, ${strategyVersion}, ${JSON.stringify([strategyFamily])}::jsonb,
          'success', null, 700, '[]'::jsonb,
          date_trunc('day', (now() at time zone 'UTC') - interval '7 days')
            at time zone 'UTC' + interval '1 hour'
        )
    `);

    await Promise.all([
      compactIntelligenceOperations(),
      compactIntelligenceOperations(),
    ]);

    const raw = await db
      .select({
        latencyMs: intelligenceOperationsTable.latencyMs,
      })
      .from(intelligenceOperationsTable)
      .where(operationDimensions);
    assert.deepEqual(
      raw.map((row) => row.latencyMs).sort((a, b) => a - b),
      [500, 700],
      "the exact UTC cutoff belongs to raw retention",
    );

    const rollups = await db
      .select()
      .from(intelligenceOperationDailyRollupsTable)
      .where(rollupDimensions);
    assert.equal(rollups.length, 1, "concurrent compaction creates one rollup");
    assert.equal(rollups[0]?.operationCount, 2);
    assert.equal(rollups[0]?.latencyTotalMs, 400);
    assert.equal(rollups[0]?.averageLatencyMs, 200);
    assert.equal(rollups[0]?.p95LatencyMs, 290);
    assert.deepEqual(rollups[0]?.latencyValuesMs, [100, 300]);

    await db
      .update(intelligenceOperationDailyRollupsTable)
      .set({ p95LatencyMs: 999_999 })
      .where(rollupDimensions);

    await db.transaction(async (tx) => {
      await tx.execute(sql`set local time zone 'Pacific/Auckland'`);
      await compactIntelligenceOperations(tx);
      const report = await reportIntelligenceOperations(240, tx);
      const rows = report.rows.filter((row) => row.engine === engine) as Array<{
        count: number;
        averageLatencyMs: number;
        p95LatencyMs: number;
      }>;

      assert.equal(
        rows.reduce((sum, row) => sum + row.count, 0),
        4,
        "long reports combine compacted and raw rows exactly once",
      );
      assert.deepEqual(
        rows
          .map((row) => ({
            count: row.count,
            averageLatencyMs: row.averageLatencyMs,
            p95LatencyMs: row.p95LatencyMs,
          }))
          .sort((a, b) => a.averageLatencyMs - b.averageLatencyMs),
        [
          { count: 2, averageLatencyMs: 200, p95LatencyMs: 290 },
          { count: 2, averageLatencyMs: 600, p95LatencyMs: 690 },
        ],
        "mixed raw and rollup metrics use the mergeable distribution rather than the stored daily p95",
      );
    });
  } finally {
    await db.delete(intelligenceOperationsTable).where(operationDimensions);
    await db
      .delete(intelligenceOperationDailyRollupsTable)
      .where(rollupDimensions);
  }
});