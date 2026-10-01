import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, Field, PageHeader, Panel, Select, SourceNote, StatusBadge, TabBar } from "@/components/engine";
import { planRunProgression, templateRunPlan } from "@/lib/ai";
import { RUN_TABS, parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { RUN_TYPE_LABELS } from "@/lib/types";
import type { RunWorkout } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/run")({
  validateSearch: parseTabSearch,
  component: Run,
});

function Run() {
  const [tab, setTab] = useState("plan");
  return (
    <div>
      <PageHeader
        kicker="Run"
        title="Run training"
        detail="Walk/run progressions that live in the same plan as your strength work. AI suggests, you decide."
      />
      <TabBar tabs={[...RUN_TABS]} value={tab} onChange={setTab} />
      {tab === "plan" ? <RunPlanView /> : <RunLog />}
    </div>
  );
}

function pace(distanceKm: number, durationMin: number) {
  if (!distanceKm || !durationMin) return "—";
  const perKm = durationMin / distanceKm;
  const m = Math.floor(perKm);
  const s = Math.round((perKm - m) * 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

function RunPlanView() {
  const state = useForge();
  const saveRunPlan = useForge((s) => s.saveRunPlan);
  const activateRunPlan = useForge((s) => s.activateRunPlan);
  const advanceRunWeek = useForge((s) => s.advanceRunWeek);
  const plan = state.runPlans.find((p) => p.id === state.activeRunPlanId && p.status === "active");
  const [goal, setGoal] = useState<"5k" | "10k" | "habit">("5k");
  const [longest, setLongest] = useState("2");
  const [days, setDays] = useState("3");
  const [busy, setBusy] = useState(false);

  const useTemplate = () => {
    const id = saveRunPlan({ ...templateRunPlan(goal), status: "draft" });
    activateRunPlan(id);
    toast.success("Template run plan activated.");
  };

  const useAi = async () => {
    setBusy(true);
    try {
      const res = await planRunProgression({
        data: { goal, longestRunKm: Number(longest) || 0, daysPerWeek: Number(days) || 3 },
      });
      if (!res.ok) {
        toast.error(`AI unavailable (${res.error}). Template used instead — clearly labeled.`);
        useTemplate();
        return;
      }
      const data = res as { ok: true; title: string; weeks: RunWorkout[][] };
      const id = saveRunPlan({
        title: data.title,
        goal,
        weeks: data.weeks,
        currentWeek: 1,
        status: "draft",
        source: "ai",
      });
      activateRunPlan(id);
      toast.success("AI run plan drafted and activated. Review the weeks below.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {plan ? (
        <Panel
          title={`${plan.title} · Week ${plan.currentWeek} of ${plan.weeks.length}`}
          action={<SourceNote source={plan.source} />}
        >
          <div className="space-y-2">
            {(plan.weeks[plan.currentWeek - 1] ?? []).map((w, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{w.day} · {w.detail}</div>
                </div>
                <StatusBadge status={RUN_TYPE_LABELS[w.type]} tone="muted" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {plan.currentWeek < plan.weeks.length ? (
              <Button size="sm" onClick={() => { advanceRunWeek(plan.id); toast.success(`Week ${plan.currentWeek + 1} unlocked.`); }}>
                Complete week → next
              </Button>
            ) : (
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ok">Final week — finish strong</span>
            )}
          </div>
        </Panel>
      ) : (
        <EmptyState title="No active run plan" detail="Start a walk/run progression below — from Couch to 5K to a 10K base." />
      )}

      <Panel title="New run plan">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Goal">
            <Select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)}>
              <option value="5k">Run 5K</option>
              <option value="10k">Run 10K</option>
              <option value="habit">Build the habit</option>
            </Select>
          </Field>
          <Field label="Longest recent run (km)">
            <input type="number" min={0} step={0.5} className="engine-select" value={longest} onChange={(e) => setLongest(e.target.value)} />
          </Field>
          <Field label="Days per week">
            <Select value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={useAi} disabled={busy}>{busy ? "Drafting…" : "Generate with AI"}</Button>
          <Button variant="outline" onClick={useTemplate}>Use template</Button>
        </div>
      </Panel>
    </div>
  );
}

function RunLog() {
  const state = useForge();
  const logRun = useForge((s) => s.logRun);
  const [km, setKm] = useState("");
  const [min, setMin] = useState("");
  const [effort, setEffort] = useState("3");
  const [notes, setNotes] = useState("");

  const submit = () => {
    const distanceKm = Number(km);
    const durationMin = Number(min);
    if (!distanceKm || !durationMin) {
      toast.error("Enter distance and duration.");
      return;
    }
    logRun({
      date: new Date().toISOString(),
      distanceKm,
      durationMin,
      effort: Number(effort) as 1 | 2 | 3 | 4 | 5,
      notes: notes || undefined,
    });
    setKm(""); setMin(""); setNotes("");
    toast.success("Run logged. +15 XP.");
  };

  const totalKm = state.runSessions.reduce((n, r) => n + r.distanceKm, 0);
  const longest = Math.max(0, ...state.runSessions.map((r) => r.distanceKm));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel title="Total distance"><div className="font-mono text-2xl font-semibold">{totalKm.toFixed(1)} km</div></Panel>
        <Panel title="Longest run"><div className="font-mono text-2xl font-semibold">{longest.toFixed(1)} km</div></Panel>
        <Panel title="Runs logged"><div className="font-mono text-2xl font-semibold">{state.runSessions.length}</div></Panel>
      </div>

      <Panel title="Log a run">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Distance (km)">
            <input type="number" min={0} step={0.1} className="engine-select" value={km} onChange={(e) => setKm(e.target.value)} placeholder="3.5" />
          </Field>
          <Field label="Duration (min)">
            <input type="number" min={0} step={1} className="engine-select" value={min} onChange={(e) => setMin(e.target.value)} placeholder="32" />
          </Field>
          <Field label="Effort (1–5)">
            <Select value={effort} onChange={(e) => setEffort(e.target.value)}>
              {["1", "2", "3", "4", "5"].map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Notes">
            <input className="engine-select" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Felt smooth…" />
          </Field>
        </div>
        <Button className="mt-4" onClick={submit}>Log run</Button>
      </Panel>

      <div className="space-y-2">
        {state.runSessions.map((r) => (
          <div key={r.id} className="engine-card flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <div className="text-sm font-medium">{r.distanceKm} km · {r.durationMin} min</div>
              <div className="text-xs text-muted-foreground">
                {fmtDate(r.date)}{r.planRef ? ` · ${r.planRef}` : ""}{r.notes ? ` · ${r.notes}` : ""}
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{pace(r.distanceKm, r.durationMin)}</span>
          </div>
        ))}
        {state.runSessions.length === 0 ? <EmptyState title="No runs yet" detail="Your first walk/run counts. Log it above." /> : null}
      </div>
    </div>
  );
}
