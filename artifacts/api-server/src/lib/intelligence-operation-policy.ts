export interface IntelligenceAlert {
  severity: "critical" | "warning";
  code: "sustained-upstream-failures" | "policy-block-spike";
  message: string;
}

export interface IntelligenceAlertMetadata {
  engine: string;
  strategyVersion: string;
  strategyFamily: string;
  outcomeCounts: Record<string, number>;
  latency: {
    averageMs: number;
    p95Ms: number;
  };
}

export interface IntelligenceAlertNotification
  extends IntelligenceAlertMetadata {
  event: "triggered" | "recovered";
  alert: Pick<IntelligenceAlert, "code" | "severity" | "message">;
}

export function buildIntelligenceAlertNotification(
  alert: IntelligenceAlert,
  active: boolean,
  metadata: IntelligenceAlertMetadata,
): IntelligenceAlertNotification {
  return {
    event: active ? "triggered" : "recovered",
    alert: {
      code: alert.code,
      severity: alert.severity,
      message: alert.message,
    },
    engine: metadata.engine,
    strategyVersion: metadata.strategyVersion,
    strategyFamily: metadata.strategyFamily,
    outcomeCounts: { ...metadata.outcomeCounts },
    latency: { ...metadata.latency },
  };
}

export type IntelligenceOutcome =
  | "success"
  | "safety-block"
  | "upstream-error"
  | "rate-limit";

export function classifyIntelligenceFailure(error: unknown): {
  outcome: Exclude<IntelligenceOutcome, "success" | "rate-limit">;
  failureClass: string;
} {
  if (error instanceof Error && error.name === "IntelligenceSafetyError") {
    return { outcome: "safety-block", failureClass: "policy" };
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("429") || message.includes("rate limit")) {
    return { outcome: "upstream-error", failureClass: "upstream-rate-limit" };
  }
  if (
    message.includes("abort") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return { outcome: "upstream-error", failureClass: "timeout" };
  }
  if (message.includes("empty response")) {
    return { outcome: "upstream-error", failureClass: "empty-response" };
  }
  if (error instanceof SyntaxError) {
    return { outcome: "upstream-error", failureClass: "invalid-json" };
  }
  return { outcome: "upstream-error", failureClass: "upstream" };
}

export function launchOperationalWrites(
  writes: Array<{ name: string; run: () => PromiseLike<unknown> }>,
  onError: (name: string, error: unknown) => void,
): void {
  for (const { name, run } of writes) {
    void Promise.resolve()
      .then(run)
      .catch((error) => onError(name, error));
  }
}

export function buildIntelligenceAlerts(
  counts: Record<string, number>,
): IntelligenceAlert[] {
  const total = counts.total ?? 0;
  const failureCount = counts["upstream-error"] ?? 0;
  const blockedCount = counts["safety-block"] ?? 0;

  return [
    ...(total > 0 && failureCount >= 3 && failureCount / total >= 0.5
      ? [
          {
            severity: "critical" as const,
            code: "sustained-upstream-failures" as const,
            message:
              "Upstream failures are sustained in the latest reporting bucket.",
          },
        ]
      : []),
    ...(total > 0 && blockedCount >= 3 && blockedCount / total >= 0.25
      ? [
          {
            severity: "warning" as const,
            code: "policy-block-spike" as const,
            message:
              "Policy blocks are unusually high in the latest reporting bucket.",
          },
        ]
      : []),
  ];
}