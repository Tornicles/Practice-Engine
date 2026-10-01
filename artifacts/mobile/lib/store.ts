import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  effectiveStreak,
  generateNudges,
  stageForXp,
  xpForRun,
  xpForWorkout,
  XP_MEAL_DAY,
  XP_RATING_BONUS,
} from "./engine";
import { createSeed, todayStamp } from "./seed";
import type {
  AppSettings,
  ChatMessage,
  DietaryPrefs,
  Draft,
  Equipment,
  FitnessState,
  GroceryScan,
  MealPlan,
  OccupationProfile,
  RunPlan,
  RunSession,
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
} from "./types";
import { dayKey, uid } from "./format";

interface ForgeStore extends FitnessState {
  refreshDay: () => void;
  completeOnboarding: (s: {
    profile: UserProfile;
    occupation: OccupationProfile;
    equipment: Equipment;
    dietary: DietaryPrefs;
    settings: AppSettings;
    workoutPlan: WorkoutPlan;
    runPlan: RunPlan;
  }) => void;
  logWorkout: (s: Omit<WorkoutSession, "id">) => void;
  logRun: (s: Omit<RunSession, "id">) => void;
  saveMealPlan: (p: Omit<MealPlan, "id">) => void;
  addGroceryScan: (s: Omit<GroceryScan, "id" | "scannedAt">) => string;
  setActivePlan: (id: string) => void;
  addWorkoutPlan: (p: WorkoutPlan) => void;
  setActiveRunPlan: (id: string) => void;
  addRunPlan: (p: RunPlan) => void;
  addDraft: (d: Omit<Draft, "id" | "createdAt">) => void;
  acceptDraft: (id: string) => void;
  discardDraft: (id: string) => void;
  sendChat: (text: string, reply: string, source: "ai" | "template") => void;
  dismissNudge: (id: string) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  updateOccupation: (o: Partial<OccupationProfile>) => void;
  updateEquipment: (e: Partial<Equipment>) => void;
  updateDietary: (d: Partial<DietaryPrefs>) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  setAvatarPhoto: (uri?: string) => void;
  recordPB: (benchmarkId: string, seconds: number) => void;
  addEvent: (type: string, entityType: string, entityId: string) => void;
  markHydrated: () => void;
  startChallenge: (challengeId: string) => void;
  completeChallengeDay: (challengeId: string) => void;
  skipChallengeDay: (challengeId: string) => void;
  quitChallenge: () => void;
  resetAll: () => void;
}

const STORAGE_KEY = "forge-state-v1";

function addXp(state: FitnessState, amount: number): Pick<FitnessState, "avatar"> {
  const xp = state.avatar.xp + amount;
  return { avatar: { xp, stage: stageForXp(xp) } };
}

export const useForge = create<ForgeStore>()(
  persist(
    (set, get) => ({
      ...createSeed(),

      refreshDay: () => {
        const s = get();
        const stamp = todayStamp();
        const updates: Partial<FitnessState> = {};
        if (s.todayStamp !== stamp) {
          updates.todayStamp = stamp;
          updates.nudges = generateNudges({ ...s, todayStamp: stamp });
          const { lives } = effectiveStreak({ ...s, todayStamp: stamp });
          updates.lives = lives;
        }
        if (s.nudges.length === 0) {
          updates.nudges = generateNudges(s);
        }
        if (Object.keys(updates).length) set(updates);
      },

      completeOnboarding: (input) =>
        set((s) => ({
          onboarded: true,
          profile: input.profile,
          occupation: input.occupation,
          equipment: input.equipment,
          dietary: input.dietary,
          settings: { ...s.settings, ...input.settings },
          workoutPlans: [{ ...input.workoutPlan, status: "active" as const }],
          activePlanId: input.workoutPlan.id,
          runPlans: [{ ...input.runPlan, status: "active" as const }],
          activeRunPlanId: input.runPlan.id,
          workoutSessions: [],
          runSessions: [],
          mealPlans: [],
          groceryScans: [],
          avatar: { xp: 0, stage: "spark" as const },
          lives: { month: new Date().toISOString().slice(0, 7), left: 3 },
          nudges: [],
          drafts: [],
          pbs: {},
          challenge: null,
          chat: [
            {
              id: uid("ch"),
              role: "coach",
              text: `Welcome to Forge, ${input.profile.name.split(" ")[0]}. I suggest — you decide. Your plan is ready in the Train tab. What's your first question?`,
              at: new Date().toISOString(),
              source: "template" as const,
            },
          ],
          events: [
            { id: uid("ev"), type: "ONBOARDED", entityType: "profile", entityId: "me", at: new Date().toISOString() },
          ],
        })),

      logWorkout: (s) =>
        set((state) => {
          const session: WorkoutSession = { ...s, id: uid("ws") };
          const xp = xpForWorkout(session.minutes) + (session.difficulty ? XP_RATING_BONUS : 0);
          const events = [
            ...state.events,
            { id: uid("ev"), type: "WORKOUT_LOGGED", entityType: "workoutSession", entityId: session.id, at: new Date().toISOString() },
          ];
          const pbs = { ...state.pbs };
          if (session.benchmarkId && session.benchmarkSec) {
            const list = [...(pbs[session.benchmarkId] ?? [])];
            list.push({ seconds: session.benchmarkSec, date: session.date });
            list.sort((a, b) => a.seconds - b.seconds);
            pbs[session.benchmarkId] = list.slice(0, 10);
          }
          return {
            workoutSessions: [session, ...state.workoutSessions],
            events,
            pbs,
            ...addXp(state, xp),
          };
        }),

      logRun: (s) =>
        set((state) => {
          const session: RunSession = { ...s, id: uid("rs") };
          return {
            runSessions: [session, ...state.runSessions],
            events: [
              ...state.events,
              { id: uid("ev"), type: "RUN_LOGGED", entityType: "runSession", entityId: session.id, at: new Date().toISOString() },
            ],
            ...addXp(state, xpForRun(session.distanceKm)),
          };
        }),

      saveMealPlan: (p) =>
        set((state) => {
          const plan: MealPlan = { ...p, id: uid("mp") };
          const key = dayKey(plan.date);
          const mealPlans = [
            plan,
            ...state.mealPlans.filter((m) => dayKey(m.date) !== key),
          ];
          return { mealPlans, ...addXp(state, XP_MEAL_DAY) };
        }),

      addGroceryScan: (s) => {
        const id = uid("gs");
        set((state) => ({
          groceryScans: [{ ...s, id, scannedAt: new Date().toISOString() }, ...state.groceryScans],
        }));
        return id;
      },

      setActivePlan: (id) =>
        set((state) => ({
          activePlanId: id,
          workoutPlans: state.workoutPlans.map((p) =>
            p.id === id
              ? { ...p, status: "active" as const }
              : p.status === "active"
                ? { ...p, status: "archived" as const }
                : p,
          ),
        })),

      addWorkoutPlan: (p) => set((state) => ({ workoutPlans: [p, ...state.workoutPlans] })),

      setActiveRunPlan: (id) =>
        set((state) => ({
          activeRunPlanId: id,
          runPlans: state.runPlans.map((p) =>
            p.id === id
              ? { ...p, status: "active" as const }
              : p.status === "active"
                ? { ...p, status: "done" as const }
                : p,
          ),
        })),

      addRunPlan: (p) => set((state) => ({ runPlans: [p, ...state.runPlans] })),

      addDraft: (d) =>
        set((state) => ({
          drafts: [{ ...d, id: uid("dr"), createdAt: new Date().toISOString() }, ...state.drafts],
        })),

      acceptDraft: (id) =>
        set((state) => {
          const draft = state.drafts.find((d) => d.id === id);
          if (!draft) return {};
          const drafts = state.drafts.filter((d) => d.id !== id);
          if (draft.kind === "workout") {
            const plan = draft.payload as WorkoutPlan;
            const active = { ...plan, status: "active" as const };
            return {
              drafts,
              workoutPlans: [
                active,
                ...state.workoutPlans.map((p) =>
                  p.status === "active" ? { ...p, status: "archived" as const } : p,
                ),
              ],
              activePlanId: active.id,
            };
          }
          if (draft.kind === "run") {
            const plan = draft.payload as RunPlan;
            const active = { ...plan, status: "active" as const };
            return {
              drafts,
              runPlans: [
                active,
                ...state.runPlans.map((p) =>
                  p.status === "active" ? { ...p, status: "done" as const } : p,
                ),
              ],
              activeRunPlanId: active.id,
            };
          }
          if (draft.kind === "meals") {
            const plan = draft.payload as MealPlan;
            return {
              drafts,
              mealPlans: [{ ...plan, id: uid("mp") }, ...state.mealPlans],
              ...addXp(state, XP_MEAL_DAY),
            };
          }
          return { drafts };
        }),

      discardDraft: (id) =>
        set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) })),

      sendChat: (text, reply, source) =>
        set((state) => {
          const msgs: ChatMessage[] = [
            ...state.chat,
            { id: uid("ch"), role: "user", text, at: new Date().toISOString(), source: "template" as const },
            { id: uid("ch"), role: "coach", text: reply, at: new Date().toISOString(), source },
          ];
          return { chat: msgs.slice(-100) };
        }),

      dismissNudge: (id) =>
        set((state) => ({
          nudges: state.nudges.map((n) => (n.id === id ? { ...n, dismissed: true } : n)),
        })),

      updateProfile: (p) => set((state) => ({ profile: { ...state.profile, ...p } })),
      updateOccupation: (o) => set((state) => ({ occupation: { ...state.occupation, ...o } })),
      updateEquipment: (e) => set((state) => ({ equipment: { ...state.equipment, ...e } })),
      updateDietary: (d) => set((state) => ({ dietary: { ...state.dietary, ...d } })),
      updateSettings: (s2) => set((state) => ({ settings: { ...state.settings, ...s2 } })),
      setAvatarPhoto: (uri) => set({ avatarPhotoUri: uri }),
      recordPB: (benchmarkId, seconds) =>
        set((state) => {
          const list = [...(state.pbs[benchmarkId] ?? [])];
          list.push({ seconds, date: new Date().toISOString() });
          list.sort((a, b) => a.seconds - b.seconds);
          return { pbs: { ...state.pbs, [benchmarkId]: list.slice(0, 10) } };
        }),
      addEvent: (type, entityType, entityId) =>
        set((state) => ({
          events: [...state.events, { id: uid("ev"), type, entityType, entityId, at: new Date().toISOString() }],
        })),
      resetAll: () => set({ ...createSeed(), nudges: [] }),
      markHydrated: () => set({ hydrated: true }),

      startChallenge: (challengeId) =>
        set({
          challenge: {
            challengeId,
            day: 1,
            completedDays: [],
            startedAt: new Date().toISOString(),
          },
        }),

      completeChallengeDay: (challengeId) =>
        set((state) => {
          const c = state.challenge;
          if (!c || c.challengeId !== challengeId) return {};
          const day = c.day;
          return {
            challenge: {
              ...c,
              completedDays: c.completedDays.includes(day) ? c.completedDays : [...c.completedDays, day],
              day: day + 1,
            },
          };
        }),

      skipChallengeDay: (challengeId) =>
        set((state) => {
          const c = state.challenge;
          if (!c || c.challengeId !== challengeId) return {};
          return { challenge: { ...c, day: c.day + 1 } };
        }),

      quitChallenge: () => set({ challenge: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
      partialize: (s) => {
        const { ...rest } = s;
        return rest as FitnessState;
      },
    },
  ),
);
