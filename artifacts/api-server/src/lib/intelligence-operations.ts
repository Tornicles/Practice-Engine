import {
  db,
  intelligenceAlertStatesTable,
  intelligenceOperationsTable,
} from "@workspace/db";
import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { IntelligenceTrace } from "./practice-intelligence.ts";
import type { StrategySelection } from "./strategy-library.ts";
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

type SqlExecutor = Pick<typeof db, "execute">;

async function runIntelligenceOperationCompaction(
  executor: SqlExecutor,
): Promise<void> {
  const lock = await executor.execute(sql`
    select pg_try_advisory_xact_lock(824771109) as acquired
  `);
  if (lock.rows[0]?.acquired !== true) return;

  await executor.execute(sql`
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
        p95_latency_ms,
        latency_values_ms
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
        )::integer,
        array_agg(operation.latency_ms order by operation.latency_ms)
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
        p95_latency_ms = excluded.p95_latency_ms,
        latency_values_ms = excluded.latency_values_ms
  `);

  await executor.execute(sql`
    delete from intelligence_operations
      where created_at < date_trunc(
        'day',
        (now() at time zone 'UTC')
          - (${INTELLIGENCE_OPERATION_RAW_RETENTION_DAYS} * interval '1 day')
      ) at time zone 'UTC'
  `);
}

export async function compactIntelligenceOperations(
  executor?: SqlExecutor,
): Promise<void> {
  if (executor) {
    await runIntelligenceOperationCompaction(executor);
    return;
  }
  await db.transaction(async (tx) => {
    await runIntelligenceOperationCompaction(tx);
  });
}

export async function reportIntelligenceOperations(
  hours: number,
  executor: SqlExecutor = db,
) {
  const bucket = hours <= 72 ? "hour" : "day";
  return executor.execute(sql`
    with raw_rows as (
      select
        date_trunc(
          ${bucket},
          operation.created_at at time zone 'UTC'
        ) at time zone 'UTC' as bucket,
        operation.engine,
        operation.strategy_version,
        family.value as strategy_family,
        operation.outcome,
        operation.failure_class,
        count(*)::integer as operation_count,
        sum(operation.latency_ms)::bigint as latency_total_ms,
        array_agg(
          operation.latency_ms order by operation.latency_ms
        ) as latency_values_ms
      from intelligence_operations operation
      cross join lateral jsonb_array_elements_text(
        case
          when jsonb_array_length(operation.strategy_families) = 0
            then '["unselected"]'::jsonb
          else operation.strategy_families
        end
      ) family(value)
      where operation.created_at >= now() - (${hours} * interval '1 hour')
      group by 1, 2, 3, 4, 5, 6
    ),
    report_rows as (
      select * from raw_rows

      union all

      select
        rollup.day::timestamp at time zone 'UTC' as bucket,
        rollup.engine,
        rollup.strategy_version,
        rollup.strategy_family,
        rollup.outcome,
        nullif(rollup.failure_class, 'none') as failure_class,
        rollup.operation_count,
        rollup.latency_total_ms,
        case
          when cardinality(rollup.latency_values_ms) > 0
            then rollup.latency_values_ms
          else array_fill(rollup.p95_latency_ms, array[rollup.operation_count])
        end as latency_values_ms
      from intelligence_operation_daily_rollups rollup
      where ${bucket} = 'day'
        and rollup.day > (
          (now() at time zone 'UTC') - (${hours} * interval '1 hour')
        )::date
        and rollup.day < date_trunc(
          'day',
          (now() at time zone 'UTC')
            - (${INTELLIGENCE_OPERATION_RAW_RETENTION_DAYS} * interval '1 day')
        )::date
    )
    select
      report.bucket,
      report.engine,
      report.strategy_version as "strategyVersion",
      report.strategy_family as "strategyFamily",
      report.outcome,
      report.failure_class as "failureClass",
      sum(
        report.operation_count::numeric
          / cardinality(report.latency_values_ms)
      )::integer as count,
      round(
        sum(
          report.latency_total_ms::numeric
            / cardinality(report.latency_values_ms)
        )
          / sum(
            report.operation_count::numeric
              / cardinality(report.latency_values_ms)
          )
      )::integer as "averageLatencyMs",
      percentile_cont(0.95) within group (
        order by latency.value
      )::integer as "p95LatencyMs"
    from report_rows report
    cross join lateral unnest(report.latency_values_ms) latency(value)
    group by 1, 2, 3, 4, 5, 6
    order by 1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc
  `);
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