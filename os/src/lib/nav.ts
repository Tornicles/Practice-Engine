export type AreaPath =
  | "/"
  | "/train"
  | "/fuel"
  | "/run"
  | "/progress"
  | "/coach"
  | "/settings";

export type Dest = { to: AreaPath; tab?: string };

export const TRAIN_TABS = [
  { id: "today", label: "Today" },
  { id: "plans", label: "Plans" },
  { id: "library", label: "Exercise library" },
] as const;

export const FUEL_TABS = [
  { id: "today", label: "Today" },
  { id: "groceries", label: "Grocery scans" },
  { id: "prefs", label: "Preferences" },
] as const;

export const RUN_TABS = [
  { id: "plan", label: "Plan" },
  { id: "log", label: "Log" },
] as const;

export const PROGRESS_TABS = [
  { id: "overview", label: "Overview" },
  { id: "strength", label: "Strength" },
  { id: "running", label: "Running" },
] as const;

export const COACH_TABS = [
  { id: "chat", label: "Chat" },
  { id: "plans", label: "AI plans" },
] as const;

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "occupation", label: "Work" },
  { id: "equipment", label: "Equipment" },
  { id: "data", label: "Data" },
] as const;

export function parseTabSearch(search: Record<string, unknown>): { tab?: string } {
  return { tab: typeof search.tab === "string" ? search.tab : undefined };
}
