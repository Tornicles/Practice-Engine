import {
  db,
  intelligenceAlertStatesTable,
  intelligenceOperationsTable,
} from "@workspace/db";
import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { IntelligenceTrace } from "./practice-intelligence";
import type { StrategySelection } from "./strategy-library";
import {
  buildIntelligenceAlertNotification,
  buildIntelligenceAlerts,
  type IntelligenceAlert,
  type IntelligenceAlertNotification,
  type IntelligenceOutcome,
} from "./intelligence-operation-policy";

const ALERT_CODES = [
  "sustained-upstream-failures",
  "policy-block-spike",
] as const;

async function sendAlertNotification(
  notification: IntelligenceAlertNotification,
): Promise<boolean> {
  const url = process.env.INTELLIGENCE_ALERT_WEBHOOK_URL;
  if (!url) return false;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(notification),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`Operational alert channel returned HTTP ${response.status}`);
  }
  return true;
}

async function evaluateIntelligenceAlerts(metadata: {
  engine: string;
  strategyVersion: string;
  strategyFamilies: string[];
}): Promise<void> {
  const families =
    metadata.strategyFamilies.length > 0
      ? metadata.strategyFamilies
      : ["unselected"];

  for (const strategyFamily of families) {
    const result = await db.execute(sql`
      select
        outcome,
        count(*)::integer as count,
        round(avg(latency_ms))::integer as "averageLatencyMs",
        percentile_cont(0.95) within group (order by latency_ms)::integer as "p95LatencyMs"
      from intelligence_operations
      where created_at >= now() - interval '1 hour'
        and engine = ${metadata.engine}
        and strategy_version = ${metadata.strategyVersion}
        and (
          strategy_families @> ${JSON.stringify([strategyFamily])}::jsonb
          or (
            ${strategyFamily} = 'unselected'
            and jsonb_array_length(strategy_families) = 0
          )
        )
      group by outcome
    `);
    const rows = result.rows as Array<{
      outcome: string;
      count: number;
      averageLatencyMs: number;
      p95LatencyMs: number;
    }>;
    const outcomeCounts = rows.reduce(
      (counts, row) => {
        counts.total += row.count;
        counts[row.outcome] = row.count;
        return counts;
      },
      { total: 0 } as Record<string, number>,
    );
    const alerts = buildIntelligenceAlerts(outcomeCounts);
    const activeCodes = new Set(alerts.map((alert) => alert.code));
    const latency = {
      averageMs:
        outcomeCounts.total === 0
          ? 0
          : Math.round(
              rows.reduce(
                (sum, row) => sum + row.averageLatencyMs * row.count,
                0,
              ) / outcomeCounts.total,
            ),
      p95Ms: Math.max(0, ...rows.map((row) => row.p95LatencyMs)),
    };

    for (const alertCode of ALERT_CODES) {
      const active = activeCodes.has(alertCode);
      const [state] = await db
        .insert(intelligenceAlertStatesTable)
        .values({
          alertCode,
          engine: metadata.engine,
          strategyVersion: metadata.strategyVersion,
          strategyFamily,
          active,
        })
        .onConflictDoUpdate({
          target: [
            intelligenceAlertStatesTable.alertCode,
            intelligenceAlertStatesTable.engine,
            intelligenceAlertStatesTable.strategyVersion,
            intelligenceAlertStatesTable.strategyFamily,
          ],
          set: { active, updatedAt: new Date() },
        })
        .returning();

      if (!state || state.active === state.notifiedActive) continue;
      const [claim] = await db
        .update(intelligenceAlertStatesTable)
        .set({
          notificationActive: state.active,
          notificationClaimedAt: new Date(),
        })
        .where(
          and(
            eq(intelligenceAlertStatesTable.alertCode, alertCode),
            eq(intelligenceAlertStatesTable.engine, metadata.engine),
            eq(
              intelligenceAlertStatesTable.strategyVersion,
              metadata.strategyVersion,
            ),
            eq(
              intelligenceAlertStatesTable.strategyFamily,
              strategyFamily,
            ),
            or(
              isNull(intelligenceAlertStatesTable.notificationActive),
              lt(
                intelligenceAlertStatesTable.notificationClaimedAt,
                new Date(Date.now() - 5 * 60_000),
              ),
            ),
            ne(
              intelligenceAlertStatesTable.notifiedActive,
              intelligenceAlertStatesTable.active,
            ),
          ),
        )
        .returning();
      if (!claim) continue;

      const alert =
        alerts.find((candidate) => candidate.code === alertCode) ??
        ({
          code: alertCode,
          severity:
            alertCode === "sustained-upstream-failures"
              ? "critical"
              : "warning",
          message:
            alertCode === "sustained-upstream-failures"
              ? "Upstream failures returned to normal levels."
              : "Policy blocks returned to normal levels.",
        } satisfies IntelligenceAlert);
      try {
        const delivered = await sendAlertNotification(
          buildIntelligenceAlertNotification(alert, claim.active, {
            engine: metadata.engine,
            strategyVersion: metadata.strategyVersion,
            strategyFamily,
            outcomeCounts,
            latency,
          }),
        );
        await db
          .update(intelligenceAlertStatesTable)
          .set({
            ...(delivered ? { notifiedActive: claim.active } : {}),
            notificationActive: null,
            notificationClaimedAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(intelligenceAlertStatesTable.alertCode, alertCode),
              eq(intelligenceAlertStatesTable.engine, metadata.engine),
              eq(
                intelligenceAlertStatesTable.strategyVersion,
                metadata.strategyVersion,
              ),
              eq(
                intelligenceAlertStatesTable.strategyFamily,
                strategyFamily,
              ),
              eq(
                intelligenceAlertStatesTable.notificationActive,
                claim.active,
              ),
            ),
          );
      } catch (error) {
        await db
          .update(intelligenceAlertStatesTable)
          .set({
            notificationActive: null,
            notificationClaimedAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(intelligenceAlertStatesTable.alertCode, alertCode),
              eq(intelligenceAlertStatesTable.engine, metadata.engine),
              eq(
                intelligenceAlertStatesTable.strategyVersion,
                metadata.strategyVersion,
              ),
              eq(
                intelligenceAlertStatesTable.strategyFamily,
                strategyFamily,
              ),
              eq(
                intelligenceAlertStatesTable.notificationActive,
                claim.active,
              ),
            ),
          );
        throw error;
      }
    }
  }
}

export async function recordIntelligenceOperation(input: {
  engine: string;
  outcome: IntelligenceOutcome;
  startedAt: number;
  selection?: StrategySelection;
  trace?: IntelligenceTrace;
  failureClass?: string;
}) {
  const trace = input.trace;
  const strategyVersion =
    trace?.strategyVersion ?? input.selection?.version ?? "unselected";
  const strategyFamilies =
    trace?.strategyFamilies ?? input.selection?.families ?? [];
  await db.insert(intelligenceOperationsTable).values({
    engine: input.engine,
    strategyVersion,
    strategyFamilies,
    outcome: input.outcome,
    failureClass: input.failureClass,
    latencyMs: Math.max(0, Date.now() - input.startedAt),
    chainStages: trace?.chainStages ?? [],
  });
  await evaluateIntelligenceAlerts({
    engine: input.engine,
    strategyVersion,
    strategyFamilies,
  });
}

export function engineFromAiPath(path: string): string {
  if (path.endsWith("/simulate")) return "Practice Simulator";
  if (path.endsWith("/extract")) return "Experience & Knowledge";
  if (path.endsWith("/generate")) return "Experience to IP";
  if (path.endsWith("/next-action")) return "Growth Orchestration";
  return "Unknown";
}