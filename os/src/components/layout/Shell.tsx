import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  Dumbbell,
  Flame,
  Footprints,
  Home,
  Menu,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AvatarFigure } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { readiness, streakDays, todaysSchedule } from "@/lib/engine-loop";
import type { AreaPath } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

const items: { name: string; href: AreaPath; icon: typeof Home }[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Train", href: "/train", icon: Dumbbell },
  { name: "Fuel", href: "/fuel", icon: Apple },
  { name: "Run", href: "/run", icon: Footprints },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Coach", href: "/coach", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: Settings },
];

const mobileTabs = [items[0], items[1], items[2], items[3], items[5]];

function areaTitle(pathname: string) {
  if (pathname.startsWith("/train")) return "Train";
  if (pathname.startsWith("/fuel")) return "Fuel";
  if (pathname.startsWith("/run")) return "Run";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/coach")) return "Coach";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Home";
}

export function Shell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useForge((s) => s.profile);
  const state = useForge();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useForge.persist.rehydrate()).then(() => {
      if (!cancelled) useForge.getState().hydrate();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const streak = streakDays(state);
  const ready = readiness(state);
  const sched = todaysSchedule(state);
  const nextHref: AreaPath = sched.strengthDue ? "/train" : sched.runDue ? "/run" : "/train";
  const title = areaTitle(pathname);
  const liveNudges = state.nudges.filter((n) => !n.dismissed);

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-[62px] items-center gap-2.5 border-b border-sidebar-border px-4">
          <span className="grid size-7 place-items-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground">
            <Flame className="size-4" strokeWidth={2.2} />
          </span>
          <span className="truncate text-xs font-semibold uppercase tracking-[0.16em]">
            Forge <span className="text-primary">Trainer</span>
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.7} />
                  <span className="flex-1">{item.name}</span>
                  {item.href === "/" && liveNudges.length > 0 ? (
                    <span className="font-mono text-[0.625rem] text-primary">{liveNudges.length}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link to="/settings" className="flex items-center gap-2.5 px-2">
            <AvatarFigure spec={profile.avatar} stage={state.avatar.stage} size={32} />
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{profile.name}</div>
              <div className="truncate font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                {state.avatar.stage} · {state.avatar.xp} XP
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 bg-background/80 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-y-0 left-0 w-64 overflow-y-auto border-r border-border bg-sidebar p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Forge Trainer</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-muted-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col md:ml-56">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-border bg-background px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid size-11 place-items-center md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <span className="truncate text-xs uppercase tracking-[0.13em] text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden items-center gap-1 border border-border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider sm:inline-flex",
                streak > 0 ? "text-primary" : "text-muted-foreground",
              )}
              title="Day streak"
            >
              <Flame className="size-3" />
              {streak} day{streak === 1 ? "" : "s"}
            </span>
            <span
              className="hidden border border-border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground sm:inline-flex"
              title="Readiness score"
            >
              Ready <strong className="ml-1 text-primary">{ready}</strong>
            </span>
            <Link to={nextHref}>
              <Button size="sm">{sched.strengthDue ? "Start workout" : sched.runDue ? "Start run" : "Train"}</Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background md:hidden">
          {mobileTabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] uppercase tracking-wider",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
