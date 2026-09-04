import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Panel, StatusBadge } from "@/components/engine";
import { commercialHealth, conditions, stats } from "@/lib/compute";
import { useEngine } from "@/lib/store";

export function ImproveWork() {
  const state = useEngine();
  const inv = state.investigations[0];
  const s = stats(state);
  const health = commercialHealth(state);
  const problems = conditions(state).filter((c) => c.level === "at_risk" || c.level === "declining");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Current problems">
        {problems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No declining or at-risk conditions right now.</p>
        ) : (
          <div className="space-y-3">
            {problems.map((c) => (
              <div key={c.id} className="border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="engine-kicker">{c.domain}</span>
                  <StatusBadge status={c.level} />
                </div>
                <div className="text-sm font-medium">{c.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{c.why}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {inv ? (
        <Panel title="Open investigation" action={<StatusBadge status={inv.status} />}>
          <p className="text-sm font-medium">{inv.problem}</p>
          <p className="mt-2 text-xs text-muted-foreground">{inv.trigger}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Lost opportunities</span>
              <span className="font-mono">{state.opportunities.filter((o) => o.stage === "lost").length}</span>
            </div>
            <div className="flex justify-between">
              <span>Unsupported claims</span>
              <span className="font-mono">{s.unsupportedClaims}</span>
            </div>
            <div className="flex justify-between">
              <span>Methodology</span>
              <span className="font-mono">{health.methodologyStatus}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{health.warning}</p>
        </Panel>
      ) : (
        <Panel title="Open investigation">
          <p className="text-sm text-muted-foreground">No open investigations.</p>
        </Panel>
      )}

      {inv ? (
        <>
          <Panel title="Root causes">
            <div className="space-y-3">
              {inv.hypotheses.map((h) => (
                <button
                  key={h.text}
                  type="button"
                  className={`w-full border p-3 text-left ${h.selected ? "border-primary bg-accent" : "border-border"}`}
                  onClick={() =>
                    state.updateInvestigation(inv.id, {
                      hypotheses: inv.hypotheses.map((x) => ({ ...x, selected: x.text === h.text })),
                      rootCause: h.text,
                    })
                  }
                >
                  <div className="text-sm font-medium">{h.text}</div>
                  <p className="mt-1 text-xs text-muted-foreground">For: {h.for}</p>
                  <p className="text-xs text-muted-foreground">Against: {h.against}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Correction">
            <p className="text-sm">{inv.rootCause}</p>
            <p className="mt-3 text-sm text-muted-foreground">{inv.correction}</p>
            <p className="mt-3 text-xs">Verify: {inv.expected}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  state.updateInvestigation(inv.id, { status: "correcting" });
                  toast.message("Correction in motion. Not complete until verified.");
                }}
              >
                Start correction
              </Button>
              <Button
                onClick={() => {
                  state.updateInvestigation(inv.id, { status: "verified" });
                  toast.success("Verified against the expected result — not against activity.");
                }}
              >
                Mark verified
              </Button>
              <DashLink to="/content" tab="brand">
                <Button variant="ghost">Capture proof</Button>
              </DashLink>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              A correction is complete when the condition recalculates — not when a task is checked.
            </p>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
