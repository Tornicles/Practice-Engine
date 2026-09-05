import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashLink } from "@/components/dash-link";
import { ExperienceCapture } from "@/components/areas/experience-capture";
import { ImproveWork } from "@/components/areas/improve-work";
import { MethodologyWork } from "@/components/areas/methodology-work";
import { PracticeStudio } from "@/components/areas/practice-studio";
import { Kpi, PageHeader, Panel, ProgressBar, StatusBadge, TabBar } from "@/components/engine";
import { DEV_TABS, parseTabSearch } from "@/lib/nav";
import { skillTrack, skillViews, stats } from "@/lib/compute";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/development")({
  validateSearch: parseTabSearch,
  component: Development,
});

function Development() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "overview";
  const navigate = useNavigate({ from: "/development" });
  const state = useEngine();
  const skills = skillViews(state);
  const s = stats(state);
  const track = skillTrack(state);

  return (
    <div>
      <PageHeader
        kicker="Coach development"
        title="Development"
        detail="Practice, assessment, experience, expertise, and methodology in one workspace. This is how you get better — not a pile of separate tools."
      />
      <TabBar tabs={[...DEV_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "overview" ? (
        <div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Focus" value={state.coach.developmentFocus.split(" ")[0]} hint={state.coach.developmentFocus} />
            <Kpi label="Practice score" value={s.practiceScore} />
            <Kpi label="Experiences" value={s.experiences} />
            <Kpi label="Frameworks" value={s.frameworks} hint={`${state.methodologyTests.length} tests`} />
          </div>
          <Panel
            title={`This week's skill — ${track.skill.label}`}
            className="mb-6"
            action={
              <DashLink to="/development" tab="practice">
                <span className="text-xs text-primary">Run {track.next?.title ?? "the drill"}</span>
              </DashLink>
            }
          >
            <p className="mb-3 text-sm text-muted-foreground">
              Weakest skill is {track.skill.label} at {track.skill.current}. One scenario this week. Last score is evidence, not mastery.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {track.scenarios.map((s) => (
                <div
                  key={s.id}
                  className={`border p-3 ${track.next?.id === s.id ? "border-primary/40" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="engine-kicker text-primary">{s.tag}</div>
                    {s.lastScore != null ? (
                      <span className="font-mono text-xs text-primary">{s.lastScore}</span>
                    ) : (
                      <span className="font-mono text-[0.625rem] text-muted-foreground">Not run</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-medium">{s.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.rubric[0]}</p>
                </div>
              ))}
            </div>
          </Panel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Skills">
              <div className="space-y-4">
                {skills.map((sk) => (
                  <div key={sk.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{sk.label}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {sk.current} / {sk.target} · {sk.trend}
                      </span>
                    </div>
                    <ProgressBar value={sk.current} />
                    <div className="mt-1 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                      {sk.evidence} observations · gap {sk.gap}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Objectives & gaps">
              {state.objectives.map((o) => (
                <div key={o.id} className="mb-3 border border-border p-3">
                  <StatusBadge status={o.status} />
                  <p className="mt-2 text-sm font-medium">{o.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{o.successCriteria}</p>
                </div>
              ))}
              <div className="engine-kicker mt-4 mb-2">Development gaps</div>
              {skills
                .filter((sk) => sk.gap > 8)
                .map((sk) => (
                  <p key={sk.key} className="text-sm">
                    {sk.label} is {sk.gap} below target.
                  </p>
                ))}
              <DashLink to="/development" tab="practice" className="mt-4 inline-block text-sm text-primary">
                Open today's practice
              </DashLink>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "practice" ? <PracticeStudio /> : null}

      {tab === "assessments" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Skill scores">
            {skills.map((sk) => (
              <div key={sk.key} className="mb-3 border-b border-border/60 pb-3 last:border-0">
                <div className="mb-1 flex justify-between text-sm">
                  <span>{sk.label}</span>
                  <span className="font-mono text-xs">
                    {sk.current} · {sk.confidence} confidence
                  </span>
                </div>
                <ProgressBar value={sk.current} />
              </div>
            ))}
          </Panel>
          <Panel title="Evidence & feedback">
            <div className="space-y-3">
              {state.observations.slice(0, 8).map((o) => (
                <div key={o.id} className="border border-border p-3">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{o.skill}</span>
                    <span className="font-mono text-primary">{o.score}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.sourceType} · {o.note}
                  </p>
                  <p className="mt-1 font-mono text-[0.625rem] text-muted-foreground">{fmtDate(o.createdAt)}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === "experience" ? <ExperienceCapture /> : null}

      {tab === "expertise" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.principles.map((p) => {
            const supporting = state.experiences.filter((e) => p.experienceIds.includes(e.id));
            const contradicting = state.experiences.filter((e) => p.contradictingIds.includes(e.id));
            return (
              <Panel key={p.id} title={p.statement} action={<StatusBadge status={p.validationStatus} />}>
                <p className="text-sm text-muted-foreground">{p.explanation}</p>
                <p className="mt-2 font-mono text-[0.625rem] text-muted-foreground">
                  Evidence strength {Math.round(p.confidence * 100)} · {supporting.length} supporting ·{" "}
                  {contradicting.length} contradictions
                </p>
                <div className="engine-kicker mt-3 mb-1">Knowledge relationships</div>
                {supporting.map((e) => (
                  <p key={e.id} className="text-xs">
                    {e.title}
                  </p>
                ))}
                {contradicting.length ? (
                  <div className="mt-2">
                    <div className="engine-kicker mb-1">Contradictions</div>
                    {contradicting.map((e) => (
                      <p key={e.id} className="text-xs text-warn">
                        {e.title}
                      </p>
                    ))}
                  </div>
                ) : null}
              </Panel>
            );
          })}
        </div>
      ) : null}

      {tab === "methodology" ? <MethodologyWork /> : null}
      {tab === "improve" ? <ImproveWork /> : null}
    </div>
  );
}
