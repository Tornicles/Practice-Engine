import { db, intelligenceOperationsTable } from "@workspace/db";
import type { IntelligenceTrace } from "./practice-intelligence";
import type { StrategySelection } from "./strategy-library";
import type { IntelligenceOutcome } from "./intelligence-operation-policy";

export async function recordIntelligenceOperation(input: {
  engine: string;
  outcome: IntelligenceOutcome;
  startedAt: number;
  selection?: StrategySelection;
  trace?: IntelligenceTrace;
  failureClass?: string;
}) {
  const trace = input.trace;
  await db.insert(intelligenceOperationsTable).values({
    engine: input.engine,
    strategyVersion:
      trace?.strategyVersion ?? input.selection?.version ?? "unselected",
    strategyFamilies:
      trace?.strategyFamilies ?? input.selection?.families ?? [],
    outcome: input.outcome,
    failureClass: input.failureClass,
    latencyMs: Math.max(0, Date.now() - input.startedAt),
    chainStages: trace?.chainStages ?? [],
  });
}

export function engineFromAiPath(path: string): string {
  if (path.endsWith("/simulate")) return "Practice Simulator";
  if (path.endsWith("/extract")) return "Experience & Knowledge";
  if (path.endsWith("/generate")) return "Experience to IP";
  if (path.endsWith("/next-action")) return "Growth Orchestration";
  return "Unknown";
}