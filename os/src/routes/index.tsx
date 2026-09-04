import { createFileRoute } from "@tanstack/react-router";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Kpi, PageHeader, Panel, ProgressBar, StatusBadge } from "@/components/engine";
import {
  activityFeed,
  aiNextActions,
  currentStateViews,
  nextAction,
  recentWins,
  skillViews,
  stats,
} from "@/lib/compute";
import { parseTabSearch } from "@/lib/nav";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: parseTabSearch,
  component: Home,
});

function Home() {
  const state = useEngine();
  const s = stats(state);
  const next = nextAction(state);
  const current = currentStateViews(state);
  const skills = skillViews(state);
  const improving = skills.filter((sk) => sk.trend === "improving");
  const declining = skills.filter((sk) => sk.trend === "declining");
  const developing = skills.filter((sk) => sk.gap > 0);
  const wins = recentWins(state);
  const activity = activityFeed(state);
  const actions = aiNextActions(state);
  const practiceJob = state.todayJobs.find((j) => j.type === "practice");
  const lastSession = state.sessions[0];
  const lastClient = state.clients.find((c) => c.id === lastSession?.clientId);
  const drafts = state.content.filter((c) => c.status !== "published");

  return (
    <div>
      <PageHeader
        kicker="Command center"
        title={`Welcome, ${state.coach.name.split(" ")[0]}.`}
        detail="Today's focus, current condition, and the next move — computed from practice, clients, and content. Not a list of tools."
      />

      <div className="engine-card mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="engine-kicker text-primary">Recommended next action</div>
            <h2 className="mt-1 text-lg font-semibold">{next.title}.</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{next.why}</p>
            <p className="mt-1 text-xs text-muted-foreground">{next.action}</p>
          </div>
          <DashLink to={next.to} tab={next.tab}>
            <Button>{next.title}</Button>
          </DashLink>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Practice score" value={s.practiceScore} hint="From evidenced skills" />
        <Kpi label="Active clients" value={state.clients.filter((c) => c.status === "active").length} />
        <Kpi label="Published" value={s.contentPublished} hint={`${drafts.length} in draft`} />
        <Kpi label="Open follow-ups" value={state.threads.filter((t) => t.unread > 0).length} hint="Unread messages" />
      </div>

      <Panel title="Today" className="mb-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <TodayCell kicker="Development focus" title={state.coach.developmentFocus} to="/development" />
          <TodayCell
            kicker="Today's practice"
            title={practiceJob?.title ?? "No drill queued"}
            meta={practiceJob ? `${practiceJob.minutes} min` : undefined}
            to="/development"
            tab="practice"
          />
          <TodayCell
            kicker="Client priorities"
            title={lastClient ? `${lastClient.name}` : "No live follow-up"}
            meta={lastSession?.followUp}
            to="/clients"
            tab="session"
          />
          <TodayCell
            kicker="Content priorities"
            title={drafts[0]?.title ?? "No draft waiting"}
            meta={drafts[0]?.kind}
            to="/content"
            tab="create"
          />
          <TodayCell kicker="Next action" title={next.title} meta={`${next.minutes} min`} to={next.to} tab={next.tab} />
        </div>
      </Panel>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Current state">
          <div className="space-y-3">
            {current.map((c) => (
              <DashLink key={c.id} to={c.to} tab={c.tab} className="block border border-border p-3 hover:border-primary/40">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="engine-kicker">{c.domain}</span>
                  <StatusBadge status={c.level} />
                </div>
                <div className="text-sm font-medium">{c.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{c.why}</p>
              </DashLink>
            ))}
          </div>
        </Panel>
        <Panel title="Progress">
          <div className="space-y-4">
            {developing.map((sk) => (
              <div key={sk.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{sk.label}</span>
                  <span className="font-mono text-xs tabular-nums text-primary">
                    {sk.current}
                    <span className="ml-2 text-muted-foreground">{sk.trend}</span>
                  </span>
                </div>
                <ProgressBar value={sk.current} />
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="engine-kicker mb-1">Improving</div>
                <p className="text-sm">{improving.map((s) => s.label).join(", ") || "None this cycle"}</p>
              </div>
              <div>
                <div className="engine-kicker mb-1">Declining</div>
                <p className="text-sm">{declining.map((s) => s.label).join(", ") || "None"}</p>
              </div>
            </div>
            <div>
              <div className="engine-kicker mb-1">Current objectives</div>
              {state.objectives.map((o) => (
                <p key={o.id} className="text-sm">
                  {o.title}
                </p>
              ))}
            </div>
            <div>
              <div className="engine-kicker mb-1">Recent wins</div>
              {wins.map((w) => (
                <p key={w.title} className="text-sm">
                  {w.title} <span className="text-xs text-muted-foreground">· {w.meta}</span>
                </p>
              ))}
            </div>
            <div>
              <div className="engine-kicker mb-1">Current gaps</div>
              {skills
                .filter((sk) => sk.gap > 10)
                .map((sk) => (
                  <p key={sk.key} className="text-sm">
                    {sk.label} · gap {sk.gap}
                  </p>
                ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Activity">
          <div className="space-y-3">
            {activity.map((a, i) => (
              <DashLink key={`${a.title}-${i}`} to={a.to} tab={a.tab} className="flex items-start justify-between gap-3 border border-border p-3 hover:border-primary/40">
                <div>
                  <div className="engine-kicker">{a.kind}</div>
                  <div className="mt-1 text-sm font-medium">{a.title}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.meta}</p>
                </div>
                <span className="shrink-0 font-mono text-[0.625rem] text-muted-foreground">{fmtDate(a.at)}</span>
              </DashLink>
            ))}
          </div>
        </Panel>
        <Panel title="Next actions">
          <div className="space-y-3">
            {actions.map((a) => (
              <DashLink key={a.verb} to={a.to} tab={a.tab} className="block border border-border p-3 hover:border-primary/40">
                <div className="engine-kicker text-primary">{a.verb}</div>
                <div className="mt-1 text-sm font-medium">{a.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{a.why}</p>
              </DashLink>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TodayCell({
  kicker,
  title,
  meta,
  to,
  tab,
}: {
  kicker: string;
  title: string;
  meta?: string;
  to: "/" | "/development" | "/clients" | "/content" | "/messages" | "/help" | "/settings";
  tab?: string;
}) {
  return (
    <DashLink to={to} tab={tab} className="border border-border p-3 hover:border-primary/40">
      <div className="engine-kicker">{kicker}</div>
      <div className="mt-2 text-sm font-medium">{title}</div>
      {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
    </DashLink>
  );
}
