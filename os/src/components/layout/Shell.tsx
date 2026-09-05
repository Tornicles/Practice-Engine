import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  CircleHelp,
  Home,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { conditions, nextAction, practiceScore } from "@/lib/compute";
import type { AreaPath } from "@/lib/nav";
import { useEngine } from "@/lib/store";
import { cn } from "@/lib/utils";

const items: { name: string; href: AreaPath; icon: typeof Home }[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Development", href: "/development", icon: GraduationCap },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Content", href: "/content", icon: FileText },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Help", href: "/help", icon: CircleHelp },
  { name: "Settings", href: "/settings", icon: Settings },
];

const mobileTabs = items.slice(0, 4);

function areaTitle(pathname: string) {
  if (pathname.startsWith("/development")) return "Development";
  if (pathname.startsWith("/clients")) return "Clients";
  if (pathname.startsWith("/content")) return "Content";
  if (pathname.startsWith("/messages")) return "Messages";
  if (pathname.startsWith("/help")) return "Help";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Home";
}

export function Shell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const coach = useEngine((s) => s.coach);
  const state = useEngine();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useEngine.persist.rehydrate()).then(() => {
      if (!cancelled) useEngine.getState().hydrate();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const score = practiceScore(state);
  const atRisk = conditions(state).filter((c) => c.level === "at_risk").length;
  const next = nextAction(state);
  const unread = state.threads.reduce((n, t) => n + t.unread, 0);
  const title = areaTitle(pathname);

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-[62px] items-center gap-2.5 border-b border-sidebar-border px-4">
          <span className="grid size-7 place-items-center rounded-sm border border-primary/50 font-mono text-xs font-bold text-primary">
            P
          </span>
          <span className="truncate text-xs font-semibold uppercase tracking-[0.16em]">
            Practice <span className="text-primary">Engine</span>
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
                  {item.href === "/messages" && unread > 0 ? (
                    <span className="font-mono text-[0.625rem] text-primary">{unread}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link to="/settings" className="flex items-center gap-2 px-2">
            <div className="grid size-7 place-items-center rounded-full bg-primary/15 font-mono text-[0.625rem] font-semibold text-primary">
              {coach.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{coach.name}</div>
              <div className="truncate text-[0.625rem] text-muted-foreground">{coach.niche}</div>
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
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Practice Engine</span>
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
            {atRisk > 0 ? (
              <DashLink
                to="/development"
                tab="improve"
                className="hidden border border-destructive/40 px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-destructive sm:inline-flex"
              >
                {atRisk} at risk
              </DashLink>
            ) : null}
            <span className="hidden border border-border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground sm:inline-flex">
              Practice score <strong className="ml-1 text-primary">{score}</strong>
            </span>
            <DashLink to={next.to} tab={next.tab}>
              <Button size="sm">{next.title}</Button>
            </DashLink>
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
