import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIntelligenceAlerts,
  buildIntelligenceAlertNotification,
  classifyIntelligenceFailure,
  launchOperationalWrites,
} from "../src/lib/intelligence-operation-policy.ts";

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