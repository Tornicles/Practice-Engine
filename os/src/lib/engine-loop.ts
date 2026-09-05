import type { EngineState } from "./types";
import { conditions } from "./compute";

export const FLYWHEEL = [
  { id: "develop", label: "Develop" },
  { id: "practice", label: "Practice" },
  { id: "coach", label: "Coach" },
  { id: "capture", label: "Capture" },
  { id: "expertise", label: "Expertise" },
  { id: "method", label: "Methodology" },
  { id: "content", label: "Content" },
  { id: "sell", label: "Sell" },
  { id: "measure", label: "Measure" },
] as const;

export function flywheelLit(state: EngineState) {
  return {
    develop: state.observations.length > 0 || state.practices.length > 0,
    practice: state.practices.length > 0,
    coach: state.sessions.length > 0,
    capture: state.experiences.length > 0,
    expertise: state.principles.some((p) => ["supported", "validated"].includes(p.validationStatus)),
    method: state.frameworks.some((f) => ["supported", "validated", "testing"].includes(f.validationStatus)),
    content: state.content.some((c) => c.status === "published"),
    sell: state.opportunities.some((o) => o.stage === "won") || state.clients.some((c) => c.source === "sale"),
    measure: (state.events?.length ?? 0) > 0 || state.practices.length + state.sessions.length > 0,
  };
}

export function overallMatchesConditions(state: EngineState) {
  const conds = conditions(state);
  const overall = conds.find((c) => c.id === "c-overall");
  return overall?.level ?? "insufficient_evidence";
}

export const WIP_CAP = 3;
