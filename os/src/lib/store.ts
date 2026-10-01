import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { generateNudges, stageForXp } from "./engine-loop";
import { createSeed, todayStamp } from "./seed";
import type {
  AppSettings,
  DietaryPrefs,
  Equipment,
  FitnessEvent,
  FitnessState,
  GroceryScan,
  MealPlan,
  Nudge,
  OccupationProfile,
  RunPlan,
  RunSession,
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  DifficultyRating,
} from "./types";
import { uid } from "./utils";

function pushEvent(
  events: FitnessEvent[] | undefined,
  type: string,
  entityType: string,
  entityId: string,
): FitnessEvent[] {
  return [
    { id: uid("ev"), type, entityType, entityId, at: new Date().toISOString() },
    ...(events ?? []),
  ].slice(0, 120);
}

function awardXp(xp: number, cur: FitnessState["avatar"]): FitnessState["avatar"] {
  const next = xp + cur.xp;
  return { xp: next, stage: stageForXp(next) };
}

type Actions = {
  hydrate: () => void;
  resetDemo: () => void;
  tickDay: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateOccupation: (patch: Partial<OccupationProfile>) => void;
  updateEquipment: (patch: Partial<Equipment>) => void;
  updateDietary: (patch: Partial<DietaryPrefs>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  savePlan: (plan: Omit<WorkoutPlan, "id" | "createdAt">) => string;
  activatePlan: (id: string) => void;
  archivePlan: (id: string) => void;
  adaptPlanNote: (id: string, note: string) => void;
  logWorkout: (session: Omit<WorkoutSession, "id">) => string;
  rateWorkout: (id: string, difficulty: DifficultyRating) => void;
  logRun: (session: Omit<RunSession, "id">) => string;
  addGroceryScan: (scan: Omit<GroceryScan, "id" | "scannedAt">) => string;
  saveMealPlan: (plan: Omit<MealPlan, "id">) => string;
  saveRunPlan: (plan: Omit<RunPlan, "id" | "createdAt">) => string;
  activateRunPlan: (id: string) => void;
  advanceRunWeek: (id: string) => void;
  dismissNudge: (id: string) => void;
  addNudge: (nudge: Omit<Nudge, "id" | "createdAt">) => void;
  exportData: () => string;
};

export const useForge = create<FitnessState & Actions>()(
  persist(
    (set, get) => ({
      ...createSeed(),

      hydrate: () => {
        const stamp = todayStamp();
        const cur = get();
        if (cur.todayStamp === stamp && cur.hydrated) return;
        const patch: Partial<FitnessState> = { hydrated: true };
        if (cur.todayStamp !== stamp) {
          patch.todayStamp = stamp;
          patch.nudges = generateNudges({ ...cur, todayStamp: stamp } as FitnessState);
        }
        // Backfill guards for state persisted by older builds.
        const seed = createSeed();
        if (!cur.profile) patch.profile = seed.profile;
        if (!cur.occupation) patch.occupation = seed.occupation;
        if (!cur.equipment) patch.equipment = seed.equipment;
        if (!cur.dietary) patch.dietary = seed.dietary;
        if (!cur.avatar) patch.avatar = seed.avatar;
        if (!cur.settings) patch.settings = seed.settings;
        if (!cur.nudges) patch.nudges = generateNudges({ ...cur, ...patch } as FitnessState);
        if (!cur.events) patch.events = [];
        set(patch);
      },

      resetDemo: () => set({ ...createSeed(), hydrated: true, todayStamp: todayStamp() }),

      tickDay: () => {
        const cur = get();
        set({
          todayStamp: todayStamp(),
          nudges: generateNudges(cur),
        });
      },

      updateProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      updateOccupation: (patch) => set({ occupation: { ...get().occupation, ...patch } }),
      updateEquipment: (patch) => set({ equipment: { ...get().equipment, ...patch } }),
      updateDietary: (patch) => set({ dietary: { ...get().dietary, ...patch } }),
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      savePlan: (plan) => {
        const id = uid("wp");
        set({
          workoutPlans: [{ ...plan, id, createdAt: new Date().toISOString() }, ...get().workoutPlans],
          events: pushEvent(get().events, "PLAN_SAVED", "workoutPlan", id),
        });
        return id;
      },

      activatePlan: (id) =>
        set({
          workoutPlans: get().workoutPlans.map((p) =>
            p.id === id ? { ...p, status: "active" } : p.status === "active" ? { ...p, status: "archived" } : p,
          ),
          activePlanId: id,
          events: pushEvent(get().events, "PLAN_ACTIVATED", "workoutPlan", id),
        }),

      archivePlan: (id) =>
        set({
          workoutPlans: get().workoutPlans.map((p) => (p.id === id ? { ...p, status: "archived" } : p)),
          activePlanId: get().activePlanId === id ? undefined : get().activePlanId,
        }),

      adaptPlanNote: (id, note) =>
        set({
          workoutPlans: get().workoutPlans.map((p) => (p.id === id ? { ...p, adaptedNote: note } : p)),
        }),

      logWorkout: (session) => {
        const id = uid("ws");
        const cur = get();
        set({
          workoutSessions: [{ ...session, id }, ...cur.workoutSessions],
          avatar: awardXp(20, cur.avatar),
          events: pushEvent(cur.events, "WORKOUT_LOGGED", "workoutSession", id),
        });
        return id;
      },

      rateWorkout: (id, difficulty) =>
        set({
          workoutSessions: get().workoutSessions.map((s) => (s.id === id ? { ...s, difficulty } : s)),
          events: pushEvent(get().events, "WORKOUT_RATED", "workoutSession", id),
        }),

      logRun: (session) => {
        const id = uid("rs");
        const cur = get();
        set({
          runSessions: [{ ...session, id }, ...cur.runSessions],
          avatar: awardXp(15, cur.avatar),
          events: pushEvent(cur.events, "RUN_LOGGED", "runSession", id),
        });
        return id;
      },

      addGroceryScan: (scan) => {
        const id = uid("gs");
        set({
          groceryScans: [
            { ...scan, id, scannedAt: new Date().toISOString() },
            ...get().groceryScans,
          ],
          events: pushEvent(get().events, "GROCERIES_SCANNED", "groceryScan", id),
        });
        return id;
      },

      saveMealPlan: (plan) => {
        const id = uid("mp");
        set({
          mealPlans: [{ ...plan, id }, ...get().mealPlans],
          events: pushEvent(get().events, "MEAL_PLAN_SAVED", "mealPlan", id),
        });
        return id;
      },

      saveRunPlan: (plan) => {
        const id = uid("rp");
        set({
          runPlans: [{ ...plan, id, createdAt: new Date().toISOString() }, ...get().runPlans],
          events: pushEvent(get().events, "RUN_PLAN_SAVED", "runPlan", id),
        });
        return id;
      },

      activateRunPlan: (id) =>
        set({
          runPlans: get().runPlans.map((p) =>
            p.id === id ? { ...p, status: "active" } : p.status === "active" ? { ...p, status: "done" } : p,
          ),
          activeRunPlanId: id,
          events: pushEvent(get().events, "RUN_PLAN_ACTIVATED", "runPlan", id),
        }),

      advanceRunWeek: (id) =>
        set({
          runPlans: get().runPlans.map((p) =>
            p.id === id ? { ...p, currentWeek: Math.min(p.currentWeek + 1, p.weeks.length) } : p,
          ),
        }),

      dismissNudge: (id) =>
        set({ nudges: get().nudges.map((n) => (n.id === id ? { ...n, dismissed: true } : n)) }),

      addNudge: (nudge) =>
        set({
          nudges: [{ ...nudge, id: uid("ng"), createdAt: new Date().toISOString() }, ...get().nudges].slice(0, 20),
        }),

      exportData: () => {
        const s = get();
        const payload = {
          format: "forge-export",
          version: 1,
          exportedAt: new Date().toISOString(),
          profile: s.profile,
          occupation: s.occupation,
          equipment: s.equipment,
          dietary: s.dietary,
          workoutPlans: s.workoutPlans,
          workoutSessions: s.workoutSessions,
          groceryScans: s.groceryScans,
          mealPlans: s.mealPlans,
          runPlans: s.runPlans,
          runSessions: s.runSessions,
          avatar: s.avatar,
          settings: s.settings,
          events: s.events,
        };
        return JSON.stringify(payload, null, 2);
      },
    }),
    {
      name: "forge-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        profile: s.profile,
        occupation: s.occupation,
        equipment: s.equipment,
        dietary: s.dietary,
        workoutPlans: s.workoutPlans,
        activePlanId: s.activePlanId,
        workoutSessions: s.workoutSessions,
        groceryScans: s.groceryScans,
        mealPlans: s.mealPlans,
        runPlans: s.runPlans,
        activeRunPlanId: s.activeRunPlanId,
        runSessions: s.runSessions,
        avatar: s.avatar,
        nudges: s.nudges,
        events: s.events,
        todayStamp: s.todayStamp,
        settings: s.settings,
        hydrated: false,
      }),
    },
  ),
);
