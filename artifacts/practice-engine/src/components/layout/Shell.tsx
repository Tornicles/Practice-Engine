import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Award,
  Box,
  Briefcase,
  FileText,
  Gauge,
  Globe,
  Layers3,
  LayoutDashboard,
  Library,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useGetPracticeProfile } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { cn } from "@/lib/utils";

type NavItem = { name: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Today", href: "/today", icon: Target },
      { name: "Practice Simulator", href: "/practice", icon: Zap },
      { name: "Delivery Studio", href: "/delivery", icon: Briefcase },
    ],
  },
  {
    label: "Development",
    items: [
      { name: "Coach Lab", href: "/lab", icon: Gauge },
      { name: "Knowledge Vault", href: "/knowledge", icon: Library },
      { name: "My Methodology", href: "/methodology", icon: Layers3 },
    ],
  },
  {
    label: "Authority & IP",
    items: [
      { name: "Brand Lab", href: "/brand", icon: Sparkles },
      { name: "Course Builder", href: "/courses", icon: Box },
      { name: "Content Studio", href: "/content", icon: FileText },
      { name: "Offers & Products", href: "/products", icon: Globe },
    ],
  },
  {
    label: "Evidence",
    items: [
      { name: "Proof & Outcomes", href: "/proof", icon: Award },
      { name: "Coach Passport", href: "/passport", icon: ShieldCheck },
    ],
  },
];

const titleForPath = (path: string) => {
  const item = groups.flatMap((group) => group.items).find((nav) => path === nav.href);
  return item?.name ?? (path === "/settings" ? "Settings" : "Startup Man");
};

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: profile } = useGetPracticeProfile();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (location === "/onboarding") {
    return <main className="flex min-h-[100dvh] flex-1 flex-col">{children}</main>;
  }

  const initials = (profile?.name || "Coach")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
    } catch {
      setSignOutError("Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="engine-shell flex overflow-hidden">
      <aside className="engine-sidebar fixed inset-y-0 left-0 z-20 flex flex-col">
        <div className="flex h-[62px] shrink-0 items-center border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="group flex min-w-0 items-center gap-2.5" data-testid="link-shell-logo" aria-label="Startup Man dashboard">
            <span className="engine-logo-mark grid h-7 w-7 shrink-0 place-items-center rounded-sm text-xs font-bold" aria-hidden="true">S</span>
            <span className="engine-logo-copy truncate text-[13px] font-semibold uppercase tracking-[.16em] text-foreground">
              Startup <span className="text-primary">Man</span>
            </span>
          </Link>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
          {groups.map((group) => (
            <div className="engine-nav-group" key={group.label}>
              <div className="engine-nav-label mb-1.5 px-2.5">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = location === item.href || (item.href === "/dashboard" && location === "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-active={active}
                      data-testid={`link-nav-${item.name.toLowerCase().replaceAll(" ", "-")}`}
                      aria-label={item.name}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "engine-nav-link flex items-center gap-2.5 px-2.5 py-2 text-[12px] transition-colors",
                        active && "font-medium",
                      )}
                    >
                      <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.7} />
                      <span className="engine-nav-text truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-0.5">
          <Link
            href="/settings"
            data-active={location === "/settings"}
            data-testid="link-nav-settings"
            aria-label="Settings"
            aria-current={location === "/settings" ? "page" : undefined}
            className="engine-nav-link flex items-center gap-2.5 px-2.5 py-2 text-[12px] transition-colors"
          >
            <Settings className="h-[15px] w-[15px] shrink-0" strokeWidth={1.7} />
            <span className="engine-nav-text">Settings</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label={isSigningOut ? "Signing out" : "Sign out"}
            aria-describedby={signOutError ? "sign-out-error" : undefined}
            className="engine-nav-link flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="button-sign-out"
          >
            <LogOut className="h-[15px] w-[15px] shrink-0" strokeWidth={1.7} />
            <span className="engine-nav-text">{isSigningOut ? "Signing out…" : "Sign out"}</span>
          </button>
          {signOutError && <p id="sign-out-error" role="alert" className="px-2.5 pt-1 text-[10px] leading-snug text-destructive" data-testid="status-sign-out-error">{signOutError}</p>}

          <div className="mt-3 flex items-center gap-2 border-t border-sidebar-border px-2.5 pt-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary" data-testid="avatar-coach">
              {initials}
            </div>
            <div className="engine-profile-copy min-w-0">
              <div className="truncate text-[12px] font-medium text-foreground" data-testid="text-sidebar-coach-name">{profile?.name || "Coach"}</div>
              <div className="truncate text-[10px] text-muted-foreground">{profile?.experienceLevel || "Private workspace"}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="engine-main ml-[194px] flex min-h-[100dvh] min-w-0 flex-1 flex-col max-[720px]:ml-16 md:ml-[238px]">
        <header className="engine-topbar sticky top-0 z-10 flex items-center justify-between px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Activity className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.6} />
            <span className="truncate text-xs uppercase tracking-[.13em] text-muted-foreground" data-testid="text-current-page">
              {titleForPath(location)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="engine-topbar-score hidden border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground sm:inline-flex" data-testid="status-practice-score">
              Practice score&nbsp; <strong className="text-primary">{profile?.practiceScore ?? "—"}</strong>
            </span>
            <Link
              href="/knowledge"
              className="inline-flex h-8 items-center gap-1.5 border border-primary/50 bg-primary px-3 text-[11px] font-semibold uppercase tracking-[.08em] text-primary-foreground transition-colors hover:bg-primary/90"
              data-testid="link-capture-experience"
            >
              <span className="text-sm leading-none">+</span> Capture experience
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="engine-content">{children}</div>
        </div>
      </main>
    </div>
  );
}
