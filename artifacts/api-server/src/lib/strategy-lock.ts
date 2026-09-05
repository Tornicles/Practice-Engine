import { HttpError } from "./coach-foundation.ts";

const COMPOUND_WIN = /\band\b/i;

export function assertSingleReadingWin(statement: string) {
  if (COMPOUND_WIN.test(statement)) {
    throw new HttpError(
      400,
      "VALIDATION",
      "Winning definition is invalid if two interpretations exist.",
      { field: "statement" },
    );
  }
}

export function assertLockReady(input: {
  statement: string;
  exclusions: string[];
  advantages: string[];
  verdict: string;
  policies: number;
  strengths: string[];
}) {
  assertSingleReadingWin(input.statement);
  if (input.exclusions.filter((item) => item.trim()).length < 1) {
    throw new HttpError(400, "VALIDATION", "Focus arena requires at least one exclusion.");
  }
  if (input.advantages.length < 1 || input.advantages.length > 2) {
    throw new HttpError(409, "INVALID_STATE_TRANSITION", "Lock requires 1 or 2 advantages.");
  }
  if (input.verdict !== "keep_strategy") {
    throw new HttpError(409, "INVALID_STATE_TRANSITION", "Capability check must keep the strategy.");
  }
  const unmatched = input.advantages.filter(
    (kind) => !input.strengths.some((strength) => strength.toLowerCase().includes(kind.toLowerCase()) || kind.toLowerCase().includes(strength.toLowerCase())),
  );
  if (unmatched.length && input.strengths.length === 0) {
    throw new HttpError(422, "BUSINESS_RULE", "Advantage must match a declared strength.");
  }
  if (input.policies < 1) {
    throw new HttpError(409, "INVALID_STATE_TRANSITION", "Lock requires at least one focus policy.");
  }
}
