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
} from "./intelligence-operation-policy.ts";

const ALERT_CODES = [
  "sustained-upstream-failures",
  "policy-block-spike",
] as const;

/**
 * Raw operation telemetry is retained for seven UTC days. Complete older days
 * are reduced to neutral daily dimensions before their raw rows are deleted.
 */
export const INTELLIGENCE_OPERATION_RAW_RETENTION_DAYS = 7;
const INTELLIGENCE_OPERATION_COMPACTION_INTERVAL_MS = 6 * 60 * 60 * 1_000;

export async function compactIntelligenceOperations(): Promise<void> {
  await db.transaction(async (tx) => {
    const lock = await tx.execute(sql`
      select pg_try_advisory_xact_lock(824771109) as acquired
    `);
    if (lock.rows[0]?.acquired !== true) return;

    await tx.execute(sql`
      insert into intelligence_operation_daily_rollups (
        day,
        engine,
        strategy_version,
        strategy_family,
        outcome,
        failure_class,
        operation_count,
        latency_total_ms,
        average_latency_ms,
        p95_latency_ms
      )
      select
        (operation.created_at at time zone 'UTC')::date,
        operation.engine,
        operation.strategy_version,
        family.value,
        operation.outcome,
        coalesce(operation.failure_class, 'none'),
        count(*)::integer,
        sum(operation.latency_ms)::bigint,
        round(avg(operation.latency_ms))::integer,
        percentile_cont(0.95) within group (
          order by operation.latency_ms
        )::integer
      from intelligence_operations operation
      cross join lateral jsonb_array_elements_text(
        case
          when jsonb_array_length(operation.strategy_families) = 0
            then '["unselected"]'::jsonb
          else operation.strategy_families
        end
      ) family(value)
      where operation.created_at < date_trunc(
        'day',
        (now() at time zone 'UTC')
          - (${INTELLIGENCE_OPERATION_RAW_RETENTION_DAYS} * interval '1 day')
      ) at time zone 'UTC'
      group by 1, 2, 3, 4, 5, 6
      on conflict (
        day,
        engine,
        strategy_version,
        strategy_family,
        outcome,
        failure_class
      ) do update set
        operation_count = excluded.operation_count,
        latency_total_ms = excluded.latency_total_ms,
        average_latency_ms = excluded.average_latency_ms,
        p95_latency_ms = excluded.p95_latency_ms
    `);

    await tx.execute(sql`
      delete from intelligence_operations
      where created_at < date_trunc(
        'day',
        (now() at time zone 'UTC')
          - (${INTELLIGENCE_OPERATION_RAW_RETENTION_DAYS} * interval '1 day')
      ) at time zone 'UTC'
    `);
  });
}

export function scheduleIntelligenceOperationCompaction(
  onError: (error: unknown) => void,
): NodeJS.Timeout {
  const run = () => {
    void compactIntelligenceOperations().catch(onError);
  };
  run();
  const timer = setInterval(
    run,
    INTELLIGENCE_OPERATION_COMPACTION_INTERVAL_MS,
  );
  timer.unref();
  return timer;
}

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