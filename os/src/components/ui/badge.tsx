import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "gold" | "ok" | "warn" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
        tone === "gold" && "border border-primary/40 bg-accent text-primary",
        tone === "ok" && "border border-ok/30 bg-ok/10 text-ok",
        tone === "warn" && "border border-warn/30 bg-warn/10 text-warn",
        tone === "danger" && "border border-destructive/30 bg-destructive/10 text-destructive",
        tone === "muted" && "border border-border bg-secondary text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
