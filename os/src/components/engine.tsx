import { DashLink } from "@/components/dash-link";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AreaPath } from "@/lib/nav";

export function PageHeader({
  kicker,
  title,
  detail,
  action,
}: {
  kicker: string;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="engine-kicker mb-2">{kicker}</div>
        <h1 className="engine-title">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="engine-card p-4">
      <div className="engine-kicker">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function StatusBadge({ status, tone }: { status: string; tone?: "ok" | "warn" | "danger" | "muted" | "gold" }) {
  const s = status.toLowerCase();
  const inferred =
    tone ??
    (["active", "done", "just right", "just_right"].includes(s)
      ? "ok"
      : ["draft", "paused"].includes(s)
        ? "warn"
        : ["too hard", "too_hard", "cold"].includes(s)
          ? "danger"
          : s === "ai" || s === "vision"
            ? "gold"
            : "muted");
  return <Badge tone={inferred}>{status.replaceAll("_", " ")}</Badge>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="engine-progress" aria-hidden>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="engine-card border-dashed px-6 py-12 text-center">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("engine-card overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("engine-select", className)} {...props} />;
}

export function TabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[] | string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const items = tabs.map((t) => (typeof t === "string" ? { id: t, label: t } : t));
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "h-11 shrink-0 px-3 text-xs uppercase tracking-wider",
            value === t.id ? "border-b-2 border-primary text-foreground" : "text-muted-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SourceNote({ source }: { source: string }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
      {source === "ai" || source === "vision" ? "AI suggestion — confirm to activate" : `${source} plan`}
    </span>
  );
}

export function AreaLink({ to, tab, className, children }: { to: AreaPath; tab?: string; className?: string; children: ReactNode }) {
  return (
    <DashLink to={to} tab={tab} className={className}>
      {children}
    </DashLink>
  );
}
