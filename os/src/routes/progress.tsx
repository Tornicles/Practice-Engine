import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AvatarFigure, AvatarStageBadge } from "@/components/avatar";
import { EmptyState, Kpi, PageHeader, Panel, StatusBadge, TabBar } from "@/components/engine";
import { streakDays, weeklyVolume } from "@/lib/engine-loop";
import { PROGRESS_TABS, parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { AVATAR_STAGES, DIFFICULTY_LABELS } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  validateSearch: parseTabSearch,
  component: Progress,
});

function Progress() {
  const [tab, setTab] = useState("overview");
  return (
    <div>
      <PageHeader
        kicker="Progress"
        title="Your record"
        detail="Identity is your record: streaks, strength, kilometers, and an avatar that evolves as you do."
      />
      <TabBar tabs={[...PROGRESS_TABS]} value={tab} onChange={setTab} />
      {tab === "overview" ? <Overview /> : tab === "strength" ? <Strength /> : <Running />}
    </div>
  );
}

function Bars({ data, max, format }: { data: { label: string; value: number }[]; max: number; format: (v: number) => string }) {
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="font-mono text-[0.625rem] text-muted-foreground">{format(d.value)}</span>
          <div
            className="w-full rounded-sm bg-primary/70"
            style={{ height: `${max > 0 ? Math.max(4, (d.value / max) * 100) : 4}%` }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="font-mono text-[0.625rem] text-muted-foreground">{d.label.slice(0, 5)}</span>
        </div>
      ))}
    </div>
  );
}

function Overview() {
  const state = useForge();
  const streak = streakDays(state);
  const volume = weeklyVolume(state, 8);
  const maxW = Math.max(1, ...volume.map((v) => v.workouts));
  const maxKm = Math.max(1, ...volume.map((v) => v.km));
  const totalKm = state.runSessions.reduce((n, r) => n + r.distanceKm, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Day streak" value={streak} />
        <Kpi label="Total workouts" value={state.workoutSessions.length} />
        <Kpi label="Total run km" value={totalKm.toFixed(0)} />
        <Kpi label="Avatar XP" value={state.avatar.xp} hint={`${state.avatar.stage} stage`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Workouts per week">
          <Bars data={volume.map((v) => ({ label: v.label, value: v.workouts }))} max={maxW} format={(v) => `${v}`} />
        </Panel>
        <Panel title="Run km per week">
          <Bars data={volume.map((v) => ({ label: v.label, value: v.km }))} max={maxKm} format={(v) => `${v}`} />
        </Panel>
      </div>

      <Panel title="Avatar evolution">
        <div className="flex flex-wrap items-center gap-6">
          <AvatarFigure spec={state.profile.avatar} stage={state.avatar.stage} size={96} />
          <div className="space-y-2">
            <AvatarStageBadge stage={state.avatar.stage} xp={state.avatar.xp} />
            <div className="flex gap-3">
              {AVATAR_STAGES.map((s) => (
                <div key={s.id} className="text-center">
                  <AvatarFigure spec={state.profile.avatar} stage={s.id} size={44} className={s.id === state.avatar.stage ? "" : "opacity-40"} />
                  <div className="mt-1 font-mono text-[0.625rem] uppercase text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="max-w-md text-xs text-muted-foreground">
              Every workout (+20 XP) and run (+15 XP) evolves your avatar. Spark → Ember → Forge → Titan.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Strength() {
  const sessions = useForge((s) => s.workoutSessions);
  const rated = sessions.filter((s) => s.difficulty);
  const counts = {
    too_easy: rated.filter((s) => s.difficulty === "too_easy").length,
    just_right: rated.filter((s) => s.difficulty === "just_right").length,
    too_hard: rated.filter((s) => s.difficulty === "too_hard").length,
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Too easy" value={counts.too_easy} hint="Time to level up" />
        <Kpi label="Just right" value={counts.just_right} hint="The sweet spot" />
        <Kpi label="Too hard" value={counts.too_hard} hint="Triggers lighter days" />
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="engine-card flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-muted-foreground">
                {fmtDate(s.date)} · {s.blocksDone}/{s.blocksTotal} blocks · {s.minutes} min{s.notes ? ` · ${s.notes}` : ""}
              </div>
            </div>
            {s.difficulty ? (
              <StatusBadge status={DIFFICULTY_LABELS[s.difficulty]} tone={s.difficulty === "just_right" ? "ok" : s.difficulty === "too_hard" ? "danger" : "warn"} />
            ) : null}
          </div>
        ))}
        {sessions.length === 0 ? <EmptyState title="No workouts yet" detail="Complete a session from Train to start your record." /> : null}
      </div>
    </div>
  );
}

function Running() {
  const sessions = useForge((s) => s.runSessions);
  const totalKm = sessions.reduce((n, r) => n + r.distanceKm, 0);
  const volume = weeklyVolume(useForge(), 8);
  const maxKm = Math.max(1, ...volume.map((v) => v.km));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Total km" value={totalKm.toFixed(1)} />
        <Kpi label="Longest run" value={`${Math.max(0, ...sessions.map((r) => r.distanceKm)).toFixed(1)} km`} />
        <Kpi label="Runs logged" value={sessions.length} />
      </div>
      <Panel title="Weekly kilometers">
        <Bars data={volume.map((v) => ({ label: v.label, value: v.km }))} max={maxKm} format={(v) => `${v}`} />
      </Panel>
      <div className="space-y-2">
        {sessions.map((r) => (
          <div key={r.id} className="engine-card flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <div className="text-sm font-medium">{r.distanceKm} km in {r.durationMin} min</div>
              <div className="text-xs text-muted-foreground">
                {fmtDate(r.date)}{r.planRef ? ` · ${r.planRef}` : ""}{r.effort ? ` · effort ${r.effort}/5` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
