export type AreaPath =
  | "/"
  | "/development"
  | "/clients"
  | "/content"
  | "/messages"
  | "/help"
  | "/settings";

export type Dest = { to: AreaPath; tab?: string };

export const DEV_TABS = [
  { id: "overview", label: "Overview" },
  { id: "practice", label: "Practice" },
  { id: "assessments", label: "Assessments" },
  { id: "experience", label: "Experience" },
  { id: "expertise", label: "Expertise" },
  { id: "methodology", label: "Methodology" },
  { id: "improve", label: "Improve" },
] as const;

export const CLIENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "session", label: "Session" },
  { id: "outcomes", label: "Outcomes" },
  { id: "performance", label: "Performance" },
  { id: "capture", label: "Capture" },
] as const;

export const CONTENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "ideas", label: "Ideas" },
  { id: "create", label: "Create" },
  { id: "brand", label: "Brand" },
  { id: "offers", label: "Offers" },
  { id: "courses", label: "Courses" },
  { id: "intelligence", label: "Intelligence" },
] as const;

export const MESSAGE_TABS = [
  { id: "inbox", label: "Inbox" },
  { id: "clients", label: "Clients" },
  { id: "leads", label: "Leads" },
  { id: "network", label: "Network" },
  { id: "assist", label: "AI Assistance" },
] as const;

export const HELP_TABS = [
  { id: "start", label: "Get Help" },
  { id: "guides", label: "Guides" },
  { id: "ask", label: "AI Help" },
  { id: "support", label: "Support" },
] as const;

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "development", label: "Development" },
  { id: "ai", label: "AI" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
] as const;

export function parseTabSearch(search: Record<string, unknown>): { tab?: string } {
  return { tab: typeof search.tab === "string" ? search.tab : undefined };
}
