import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandWork } from "@/components/areas/brand-work";
import { ContentCreate } from "@/components/areas/content-create";
import { CoursesWork } from "@/components/areas/courses-work";
import { OffersWork } from "@/components/areas/offers-work";
import { DashLink } from "@/components/dash-link";
import { Kpi, PageHeader, Panel, StatusBadge, TabBar } from "@/components/engine";
import { CONTENT_TABS, parseTabSearch } from "@/lib/nav";
import { stats, thisWeekLesson } from "@/lib/compute";
import { useEngine } from "@/lib/store";

export const Route = createFileRoute("/content")({
  validateSearch: parseTabSearch,
  component: Content,
});

function Content() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "overview";
  const navigate = useNavigate({ from: "/content" });
  const state = useEngine();
  const s = stats(state);
  const weekLesson = thisWeekLesson(state);
  const questions = state.content.flatMap((c) => c.questions);
  const ideas = [
    {
      source: "Experience",
      title: state.experiences[0]?.lesson ?? "Capture a lesson first",
      tab: "create" as const,
    },
    {
      source: "Methodology",
      title: state.frameworks[0] ? `${state.frameworks[0].name} is still ${state.frameworks[0].validationStatus}` : "No framework",
      tab: "create" as const,
    },
    {
      source: "Client problem",
      title: state.clients[0]?.objective ?? "No client problem logged",
      tab: "create" as const,
    },
    {
      source: "Audience question",
      title: questions[0] ?? "No audience questions yet",
      tab: "intelligence" as const,
    },
    {
      source: "Content gap",
      title: state.brand.claims.find((c) => c.proofIds.length === 0)?.claim ?? "Proof coverage is complete",
      tab: "brand" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        kicker="Authority, audience, commercial"
        title="Content"
        detail="Expertise becomes content, audience, offers, and products. The coach does not need five extra dashboards to do that."
      />
      <TabBar tabs={[...CONTENT_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "overview" ? (
        <div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Created" value={state.content.length} />
            <Kpi label="Published" value={s.contentPublished} />
            <Kpi label="Audience questions" value={s.audienceQuestions} />
            <Kpi label="Pipeline" value={s.pipeline} hint={`${s.conversion}% conversion`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="This week's lesson">
              {weekLesson.session ? (
                <>
                  <p className="text-sm font-medium">{weekLesson.content?.title ?? weekLesson.session.outcome}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {weekLesson.published
                      ? "Published. The lesson is live."
                      : weekLesson.captured
                        ? "Drafted from the last session. Publish it — do not start a new thread."
                        : "Last session has no content yet. This is the lesson."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!weekLesson.captured ? (
                      <button
                        type="button"
                        className="text-sm text-primary"
                        onClick={() => {
                          if (weekLesson.session) state.captureLessonFromSession(weekLesson.session.id);
                        }}
                      >
                        This session is the lesson
                      </button>
                    ) : weekLesson.content && weekLesson.content.status !== "published" ? (
                      <button
                        type="button"
                        className="text-sm text-primary"
                        onClick={() => state.publishContent(weekLesson.content!.id)}
                      >
                        Publish the lesson
                      </button>
                    ) : (
                      <DashLink to="/content" tab="create" className="text-sm text-primary">
                        Open the draft
                      </DashLink>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Run a session or a drill, then capture one sentence.</p>
              )}
            </Panel>
            <Panel title="Recommended content">
              <p className="text-sm">{ideas[0].title}</p>
              <p className="mt-2 text-xs text-muted-foreground">Drawn from a live lesson, not a content calendar.</p>
              <DashLink to="/content" tab="create" className="mt-3 inline-block text-sm text-primary">
                Draft it
              </DashLink>
            </Panel>
            <Panel title="Performance">
              <p className="text-sm">
                {questions.length} logged questions. Recurring problem: ownership vs fear in the first 90 seconds.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Questions are problem signals. Views are not authority.</p>
            </Panel>
            <Panel title="How this compounds" className="lg:col-span-2">
              <p className="text-sm text-muted-foreground">
                Expertise → Content → Audience → Offers → Products → Revenue → Results → better expertise.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {state.content.map((c) => (
                  <StatusBadge key={c.id} status={c.status} />
                ))}
                {state.offers.map((o) => (
                  <StatusBadge key={o.id} status={o.status} />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "ideas" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => (
            <DashLink
              key={idea.source}
              to="/content"
              tab={idea.tab}
              className="engine-card p-4 hover:border-primary/40"
            >
              <div className="engine-kicker text-primary">{idea.source}</div>
              <p className="mt-2 text-sm font-medium">{idea.title}</p>
            </DashLink>
          ))}
          {state.segments.map((seg) => (
            <div key={seg.id} className="engine-card p-4">
              <div className="engine-kicker">Audience</div>
              <p className="mt-2 text-sm font-medium">{seg.name}</p>
              <p className="mt-2 text-xs text-muted-foreground">Objections: {seg.objections.join(" · ")}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "create" ? <ContentCreate /> : null}
      {tab === "brand" ? <BrandWork /> : null}
      {tab === "offers" ? <OffersWork /> : null}
      {tab === "courses" ? <CoursesWork /> : null}

      {tab === "intelligence" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Audience questions">
            {questions.length ? (
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No questions logged yet.</p>
            )}
          </Panel>
          <Panel title="Topics, problems, objections">
            {state.segments.map((seg) => (
              <div key={seg.id} className="text-sm">
                <div className="font-medium">{seg.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">Problems: {seg.problems.join(" · ")}</p>
                <p className="mt-1 text-xs">Objections: {seg.objections.join(" · ")}</p>
              </div>
            ))}
          </Panel>
          <Panel title="Leads & conversions">
            <p className="text-sm">
              {s.pipeline} open · {s.conversion}% closed-won · ${s.pipelineValue.toLocaleString()} in pipeline
            </p>
            <DashLink to="/content" tab="offers" className="mt-3 inline-block text-sm text-primary">
              Open pipeline
            </DashLink>
          </Panel>
          <Panel title="Experiments">
            <p className="text-sm text-muted-foreground">
              Do not start a new experiment while an investigation is open. Proof first, then another asset.
            </p>
            <DashLink to="/development" tab="improve" className="mt-3 inline-block text-sm text-primary">
              Open the current investigation
            </DashLink>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
