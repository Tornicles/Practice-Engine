import { HttpError } from "./coach-foundation.ts";

const FORBIDDEN = new Set([
  "condition.write",
  "statistic.write",
  "expertise.validate",
  "method.validate",
  "outcome.verify",
  "correction.effective",
]);

export function assertAllowedAiOperation(operation: string) {
  if (FORBIDDEN.has(operation)) {
    throw new HttpError(422, "BUSINESS_RULE", `AI cannot perform ${operation}.`);
  }
}

export function detectIntent(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes("validate expertise") || text.includes("mark expertise")) {
    return { intent: "expertise.validate", engine: "expertise", forbidden: true };
  }
  if (text.includes("healthy") || text.includes("condition")) {
    return { intent: "condition.explain", engine: "conditions", forbidden: false };
  }
  if (text.includes("next") || text.includes("what should i do")) {
    return { intent: "recommendation.propose", engine: "practice_os", forbidden: false };
  }
  return { intent: "coach.assist", engine: "practice_os", forbidden: false };
}
