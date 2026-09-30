import type { FitnessState } from "./types";

/** One-tap full export — trust feature. Returns versioned JSON. */
export function buildExport(state: FitnessState): string {
  const payload = {
    format: "forge-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    occupation: state.occupation,
    equipment: state.equipment,
    dietary: state.dietary,
    settings: state.settings,
    workoutPlans: state.workoutPlans,
    workoutSessions: state.workoutSessions,
    runPlans: state.runPlans,
    runSessions: state.runSessions,
    mealPlans: state.mealPlans,
    groceryScans: state.groceryScans,
    avatar: state.avatar,
    pbs: state.pbs,
    events: state.events,
  };
  return JSON.stringify(payload, null, 2);
}
