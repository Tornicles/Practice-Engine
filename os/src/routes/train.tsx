import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, Field, PageHeader, Panel, Select, SourceNote, StatusBadge, TabBar } from "@/components/engine";
import { exerciseById, EXERCISES, filterExercises } from "@/lib/exercises";
import { generateWorkout, templateWorkout } from "@/lib/ai";
import { TRAIN_TABS, parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS } from "@/lib/types";
import type { DifficultyRating, EquipmentKey, MuscleGroup, WorkoutBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/train")({
  validateSearch: parseTabSearch,
  component: Train,
});

function Train() {
  const [tab, setTab] = useState("today");
  return (
    <div>
      <PageHeader
        kicker="Train"
        title="Strength sessions"
        detail="Home workouts from your equipment. AI suggests — you confirm before anything becomes your plan."
      />
      <TabBar tabs={[...TRAIN_TABS]} value={tab} onChange={setTab} />
      {tab === "today" ? <TodaySession /> : tab === "plans" ? <Plans /> : <Library />}
    </div>
  );
}

// ---------------------------------------------------------------- Today ---

function TodaySession() {
  const state = useForge();
  const logWorkout = useForge((s) => s.logWorkout);
  const rateWorkout = useForge((s) => s.rateWorkout);
  const plan = state.workoutPlans.find((p) => p.id === state.activePlanId && p.status === "active");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [adapt, setAdapt] = useState<"none" | "short" | "lowimpact" | "bodyweight">("none");
  const [loggedId, setLoggedId] = useState<string | null>(null);

  const blocks: (WorkoutBlock & { key: string })[] = useMemo(() => {
    if (!plan) return [];
    let list = plan.blocks.map((b, i) => ({ ...b, key: `${b.exerciseId}-${i}` }));
    if (adapt === "short") list = list.slice(0, 3);
    if (adapt === "lowimpact") list = list.filter((b) => exerciseById.get(b.exerciseId)?.impact === "low");
    if (adapt === "bodyweight")
      list = list.filter((b) => {
        const eq = exerciseById.get(b.exerciseId)?.equipment ?? [];
        return eq.length === 1 && eq[0] === "bodyweight";
      });
    return list;
  }, [plan, adapt]);

  if (!plan) {
    return (
      <EmptyState
        title="No active plan"
        detail="Generate a workout plan first — with AI or from a template — then confirm it to make it active."
      />
    );
  }

  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const complete = () => {
    const id = logWorkout({
      planId: plan.id,
      title: plan.title,
      date: new Date().toISOString(),
      minutes: plan.minutes,
      blocksDone: done.size,
      blocksTotal: blocks.length,
      notes: adapt !== "none" ? `Adapted: ${adapt}` : undefined,
    });
    setLoggedId(id);
    toast.success("Workout logged. How did it feel?");
  };

  const rate = (d: DifficultyRating) => {
    if (!loggedId) return;
    rateWorkout(loggedId, d);
    setLoggedId(null);
    setDone(new Set());
    toast.success(`Rated "${DIFFICULTY_LABELS[d]}" — tomorrow's plan adapts.`);
  };

  return (
    <div className="space-y-4">
      <Panel
        title={plan.title}
        action={<SourceNote source={plan.source} />}
      >
        <div className="engine-kicker mb-3 text-primary">Adapt gate — tune before you start</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["none", "As planned"],
              ["short", "15-min version"],
              ["lowimpact", "Low impact only"],
              ["bodyweight", "Bodyweight only"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAdapt(id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs",
                adapt === id ? "border-primary/60 bg-accent text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {plan.adaptedNote ? <p className="mb-4 text-xs text-muted-foreground">Work-aware: {plan.adaptedNote}</p> : null}
        <ol className="space-y-2">
          {blocks.map((b) => {
            const ex = exerciseById.get(b.exerciseId);
            const checked = done.has(b.key);
            return (
              <li key={b.key}>
                <button
                  type="button"
                  onClick={() => toggle(b.key)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border p-3 text-left",
                    checked ? "border-ok/40 bg-ok/5 opacity-70" : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded border font-mono text-xs",
                      checked ? "border-ok bg-ok text-black" : "border-border",
                    )}
                    aria-hidden
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", checked && "line-through")}>
                      {ex?.name ?? b.exerciseId}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {b.sets} × {b.reps ? `${b.reps} reps` : `${b.seconds}s`} · rest {b.restSec}s
                    </span>
                    {ex?.cues[0] ? <span className="block text-xs text-muted-foreground">Cue: {ex.cues[0]}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {loggedId ? (
          <div className="mt-4 rounded-md border border-primary/40 bg-accent p-4">
            <div className="engine-kicker mb-2 text-primary">Rate this session — it tunes the next one</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DIFFICULTY_LABELS) as DifficultyRating[]).map((d) => (
                <Button key={d} size="sm" variant="outline" onClick={() => rate(d)}>
                  {DIFFICULTY_LABELS[d]}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <Button className="mt-4" onClick={complete} disabled={blocks.length === 0}>
            Complete workout ({done.size}/{blocks.length})
          </Button>
        )}
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- Plans ---

function Plans() {
  const state = useForge();
  const savePlan = useForge((s) => s.savePlan);
  const activatePlan = useForge((s) => s.activatePlan);
  const [focus, setFocus] = useState<"upper" | "lower" | "full" | "core" | "conditioning">("full");
  const [minutes, setMinutes] = useState<"15" | "20" | "30" | "45">("30");
  const [level, setLevel] = useState<"1" | "2" | "3">("1");
  const [busy, setBusy] = useState(false);

  const base = {
    focus,
    minutes: Number(minutes) as 15 | 20 | 30 | 45,
    equipment: state.equipment,
    level: Number(level) as 1 | 2 | 3,
    lowImpact: state.profile.injuries.length > 0,
  };

  const useTemplate = () => {
    savePlan({ ...templateWorkout(base), status: "draft" });
    toast.success("Template plan saved as draft. Confirm it to activate.");
  };

  const useAi = async () => {
    setBusy(true);
    try {
      const res = await generateWorkout({
        data: {
          focus,
          minutes: base.minutes,
          level: base.level,
          equipment: (Object.keys(state.equipment) as EquipmentKey[]).filter((k) => state.equipment[k]),
          injuries: state.profile.injuries,
          occupationNote: `${state.occupation.workType}, ${state.occupation.hoursPerDay}h/day`,
        },
      });
      if (!res.ok) {
        toast.error(`AI unavailable (${res.error}). Template saved instead — clearly labeled.`);
        useTemplate();
        return;
      }
      const raw = res as { ok: true; title: string; blocks: { name: string; sets: number; reps?: number; seconds?: number; restSec: number; cue?: string }[] };
      const mapped: WorkoutBlock[] = [];
      for (const b of raw.blocks) {
        const match = EXERCISES.find(
          (e) => e.name.toLowerCase() === String(b.name).toLowerCase() || e.name.toLowerCase().includes(String(b.name).toLowerCase()),
        );
        if (match) mapped.push({ exerciseId: match.id, sets: b.sets || 3, reps: b.reps, seconds: b.seconds, restSec: b.restSec ?? 45 });
      }
      if (mapped.length < 3) {
        toast.error("AI returned too few known exercises. Template saved instead.");
        useTemplate();
        return;
      }
      savePlan({
        title: raw.title,
        focus,
        minutes: base.minutes,
        level: base.level === 1 ? "beginner" : base.level === 2 ? "intermediate" : "advanced",
        blocks: mapped,
        status: "draft",
        source: "ai",
      });
      toast.success("AI plan drafted. Review it, then confirm to activate.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="New plan">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Focus">
            <Select value={focus} onChange={(e) => setFocus(e.target.value as typeof focus)}>
              <option value="upper">Upper body</option>
              <option value="lower">Lower body</option>
              <option value="full">Full body</option>
              <option value="core">Core</option>
              <option value="conditioning">Conditioning</option>
            </Select>
          </Field>
          <Field label="Minutes">
            <Select value={minutes} onChange={(e) => setMinutes(e.target.value as typeof minutes)}>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </Select>
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
              <option value="1">Beginner</option>
              <option value="2">Intermediate</option>
              <option value="3">Advanced</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={useAi} disabled={busy}>{busy ? "Drafting…" : "Generate with AI"}</Button>
          <Button variant="outline" onClick={useTemplate}>Use template</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">AI drafts only — nothing becomes active until you confirm it.</p>
      </Panel>

      <div className="space-y-3">
        {state.workoutPlans.map((p) => (
          <div key={p.id} className="engine-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{p.title}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.blocks.length} blocks · {p.minutes} min · {p.focus} · {p.level}
              </div>
              <SourceNote source={p.source} />
            </div>
            {p.status !== "active" ? (
              <Button size="sm" variant="outline" onClick={() => { activatePlan(p.id); toast.success("Plan activated."); }}>
                Confirm & activate
              </Button>
            ) : (
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ok">Active</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------- Library ---

const MUSCLES: ("all" | MuscleGroup)[] = ["all", "chest", "back", "shoulders", "arms", "core", "glutes", "legs", "full"];

function Library() {
  const equipment = useForge((s) => s.equipment);
  const [muscle, setMuscle] = useState<(typeof MUSCLES)[number]>("all");
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [lowImpact, setLowImpact] = useState(false);

  const list = useMemo(
    () =>
      filterExercises({
        equipment: ownedOnly ? equipment : { bodyweight: true, dumbbells: true, bands: true, chair: true, pullupBar: true, kettlebell: true },
        muscles: muscle === "all" ? undefined : [muscle],
        impact: lowImpact ? "low" : undefined,
      }),
    [equipment, muscle, ownedOnly, lowImpact],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={muscle} onChange={(e) => setMuscle(e.target.value as typeof muscle)} className="w-44">
          {MUSCLES.map((m) => (
            <option key={m} value={m}>{m === "all" ? "All muscles" : m}</option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} />
          My equipment only
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={lowImpact} onChange={(e) => setLowImpact(e.target.checked)} />
          Low impact
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <div key={e.id} className="engine-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{e.name}</h3>
              <StatusBadge status={`level ${e.level}`} tone="muted" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {e.muscles.join(" · ")} · {e.equipment.map((k) => EQUIPMENT_LABELS[k]).join(", ")}
            </div>
            <ul className="mt-2 space-y-1">
              {e.cues.slice(0, 2).map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {c}</li>
              ))}
            </ul>
            {(e.regressTo || e.progressTo) && (
              <div className="mt-2 font-mono text-[0.625rem] text-muted-foreground">
                {e.regressTo ? `← ${exerciseById.get(e.regressTo)?.name ?? e.regressTo}` : ""}{" "}
                {e.progressTo ? `${exerciseById.get(e.progressTo)?.name ?? e.progressTo} →` : ""}
              </div>
            )}
          </div>
        ))}
      </div>
      {list.length === 0 ? <EmptyState title="No matches" detail="Loosen the filters or add equipment in Settings." /> : null}
    </div>
  );
}
