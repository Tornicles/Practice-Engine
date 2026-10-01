import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { AvatarFigure, AvatarStageBadge } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { AreaLink, Kpi, PageHeader, Panel } from "@/components/engine";
import { readiness, streakDays, todaysSchedule, weeklyVolume } from "@/lib/engine-loop";
import { parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { GOAL_LABELS } from "@/lib/types";

export const Route = createFileRoute("/")({
  validateSearch: parseTabSearch,
  component: Home,
});

function Home() {
  const state = useForge();
  const dismissNudge = useForge((s) => s.dismissNudge);
  const streak = streakDays(state);
  const ready = readiness(state);
  const sched = todaysSchedule(state);
  const volume = weeklyVolume(state, 4);
  const weekWorkouts = volume[volume.length - 1]?.workouts ?? 0;
  const weekKm = volume[volume.length - 1]?.km ?? 0;
  const firstName = state.profile.name.split(" ")[0];
  const nudges = state.nudges.filter((n) => !n.dismissed);

  return (
    <div>
      <PageHeader
        kicker="Today"
        title={`Morning, ${firstName}.`}
        detail="AI suggests, you decide. Check the plan, adapt it to your day, then train."
        action={
          <div className="flex items-center gap-3">
            <AvatarFigure spec={state.profile.avatar} stage={state.avatar.stage} size={52} />
            <AvatarStageBadge stage={state.avatar.stage} xp={state.avatar.xp} />
          </div>
        }
      />

      {nudges.length > 0 ? (
        <div className="mb-6 space-y-2">
          {nudges.map((n) => (
            <div key={n.id} className="engine-card flex items-start justify-between gap-3 border-primary/30 p-3">
              <p className="text-sm">{n.text}</p>
              <div className="flex shrink-0 gap-2">
                <AreaLink to={n.href} className="text-xs font-medium text-primary hover:underline">
                  Open
                </AreaLink>
                <button
                  type="button"
                  onClick={() => dismissNudge(n.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Day streak" value={streak} hint={streak > 0 ? "Keep the chain unbroken" : "Log a session to start"} />
        <Kpi label="Readiness" value={ready} hint="From recent ratings + work load" />
        <Kpi label="Sessions this week" value={weekWorkouts} hint="Strength workouts" />
        <Kpi label="Run km this week" value={weekKm} hint="Across all runs" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Today's training"
          action={<AreaLink to="/train" className="text-xs font-medium text-primary hover:underline">Train →</AreaLink>}
        >
          {sched.restSuggested ? (
            <div>
              <p className="text-sm font-medium text-warn">Rest day suggested</p>
              <p className="mt-1 text-sm text-muted-foreground">{sched.restReason}</p>
              <p className="mt-3 text-xs text-muted-foreground">A walk or mobility counts. The plan will be here tomorrow.</p>
            </div>
          ) : sched.strengthDue ? (
            <div>
              <div className="engine-kicker text-primary">Strength · {sched.activePlan?.minutes} min</div>
              <h3 className="mt-1 text-base font-semibold">{sched.activePlan?.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {sched.activePlan?.blocks.length} blocks · {sched.activePlan?.focus}
                {sched.activePlan?.adaptedNote ? ` · adapted for ${state.occupation.workType} work` : ""}
              </p>
              <AreaLink to="/train" tab="today">
                <Button className="mt-4" size="sm">Open today's session</Button>
              </AreaLink>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">
                No strength session scheduled. {sched.activePlan ? "Your plan runs Mon / Wed / Fri." : "Generate a plan to get scheduled sessions."}
              </p>
              <AreaLink to="/train" tab="plans">
                <Button className="mt-4" size="sm" variant="outline">Browse plans</Button>
              </AreaLink>
            </div>
          )}
          {sched.runDue ? (
            <div className="mt-4 border-t border-border pt-4">
              <div className="engine-kicker text-primary">Run · {sched.runDue.day}</div>
              <h3 className="mt-1 text-base font-semibold">{sched.runDue.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{sched.runDue.detail}</p>
              <AreaLink to="/run" tab="log">
                <Button className="mt-3" size="sm" variant="outline">Log run</Button>
              </AreaLink>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Today's fuel"
          action={<AreaLink to="/fuel" className="text-xs font-medium text-primary hover:underline">Fuel →</AreaLink>}
        >
          {(() => {
            const today = new Date().toISOString().slice(0, 10);
            const plan = state.mealPlans.find((m) => m.date.slice(0, 10) === today);
            if (!plan) {
              return (
                <div>
                  <p className="text-sm text-muted-foreground">No meals planned yet today.</p>
                  <AreaLink to="/fuel" tab="groceries">
                    <Button className="mt-4" size="sm" variant="outline">Plan from groceries</Button>
                  </AreaLink>
                </div>
              );
            }
            return (
              <ul className="space-y-2">
                {plan.meals.map((m, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.ingredients.slice(0, 4).join(", ")}</div>
                    </div>
                    {m.calories ? <span className="font-mono text-xs text-muted-foreground">{m.calories} kcal</span> : null}
                  </li>
                ))}
              </ul>
            );
          })()}
        </Panel>
      </div>

      <Panel title="Your goal" className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
            <Flame className="size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{GOAL_LABELS[state.profile.goal]}</div>
            <div className="text-xs text-muted-foreground">{state.profile.goalDetail}</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
