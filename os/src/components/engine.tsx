import { DashLink } from "@/components/dash-link";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConditionLevel, ValidationStatus } from "@/lib/types";
import { flywheel } from "@/lib/compute";
import { useEngine } from "@/lib/store";

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

export function StatusBadge({ status }: { status: ValidationStatus | ConditionLevel | string }) {
  const tone =
    status === "validated" || status === "healthy" || status === "improving" || status === "verified" || status === "new" || status === "won"
      ? "ok"
      : status === "at_risk" || status === "retired" || status === "lost" || status === "critical"
        ? "danger"
        : status === "testing" || status === "declining" || status === "candidate" || status === "needs_revision"
          ? "warn"
          : status === "supported"
            ? "gold"
            : "muted";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
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

export function LineageList({
  items,
}: {
  items: { label: string; href?: string; meta?: string }[];
}) {
  return (
    <ol className="relative ml-2 space-y-4 border-l border-border pl-4">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
          {item.href ? (
            <DashLink to={item.href as "/development"} className="text-sm font-medium text-foreground hover:text-primary">
              {item.label}
            </DashLink>
          ) : (
            <div className="text-sm font-medium">{item.label}</div>
          )}
          {item.meta ? <div className="text-xs text-muted-foreground">{item.meta}</div> : null}
        </li>
      ))}
    </ol>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
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

export function Flywheel() {
  const nodes = flywheel(useEngine());
  return (
    <div className="engine-card p-4">
      <div className="engine-kicker mb-3 text-primary">Operating flywheel</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-2">
            <DashLink
              to={n.to}
              tab={n.tab}
              className="min-w-40 shrink-0 border border-border px-3 py-2 hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{n.label}</span>
                <StatusBadge status={n.level} />
              </div>
              <div className="mt-1 font-mono text-[0.625rem] text-muted-foreground">{n.meta}</div>
            </DashLink>
            {i < nodes.length - 1 ? (
              <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
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
