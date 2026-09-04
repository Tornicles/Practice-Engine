import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader, Panel, TabBar } from "@/components/engine";
import { askHelp } from "@/lib/ai";
import { HELP_TABS, parseTabSearch } from "@/lib/nav";
import { currentStateViews, nextAction } from "@/lib/compute";
import { useEngine } from "@/lib/store";

export const Route = createFileRoute("/help")({
  validateSearch: parseTabSearch,
  component: Help,
});

const gettingStarted = [
  { title: "How Practice Engine works", body: "You work in four places: Home (what matters today), Development (your craft), Clients (live rooms), Content (authority and commercial expression). Messages, Help, and Settings support that work. Behind the scenes the product tracks evidence, conditions, and next actions — you never have to operate those as separate dashboards." },
  { title: "Getting started", body: "Do today's recommended action on Home. Practice once. Capture one experience. Do not build an offer until a lesson has evidence." },
  { title: "Development", body: "Practice difficult moments, assess skills, capture experience, promote only what is evidenced, and investigate when a condition declines." },
  { title: "Clients", body: "Prepare, run, record the client's response separately from your story, then capture the lesson." },
  { title: "Content", body: "Draft from a lesson or principle. Brand, offers, and courses live here because they are public expressions of the same expertise." },
  { title: "Messages", body: "Reply, extract commitments, and turn a conversation into a follow-up on Home." },
];

const guides = [
  { title: "Coaching practice", body: "One scenario, one skill, then evaluate. Scores are observations, not mastery." },
  { title: "Client sessions", body: "Review the previous outcome, name an objective, intervene once, write the client's response as its own field." },
  { title: "Experience capture", body: "What happened, what you did, what resulted, what you think it means. The product extracts candidates. You keep or discard them." },
  { title: "Methodology", body: "Principle → method → framework → protocol → exercise. Nothing is published IP until you promote it." },
  { title: "Content", body: "Pull a lesson into a draft. Log audience questions as research, not as vanity." },
  { title: "Offers", body: "An offer inherits methodology and proof. If the methodology is in testing, the offer stays a hypothesis." },
  { title: "Courses", body: "Productize only supported methodology. A published outline is not a validated product." },
];

function Help() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "start";
  const navigate = useNavigate({ from: "/help" });
  const state = useEngine();
  const next = nextAction(state);
  const overall = currentStateViews(state).find((c) => c.id === "c-overall");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState("");

  async function ask(preset?: string) {
    const q = preset || question;
    if (!q.trim()) return;
    setBusy(true);
    const out = await askHelp({
      data: {
        question: q,
        context: `Coach: ${state.coach.name}. Focus: ${state.coach.developmentFocus}. Next action: ${next.title}. Overall: ${overall?.title}. Score: ${overall?.level}.`,
      },
    });
    setBusy(false);
    if (!out.ok) {
      setAnswer(
        "Home is the command center. Development is where you practice and turn experience into expertise. Clients is live work. Content is how that work becomes public. If a condition is at risk, investigate it in Development → Improve before creating more assets.",
      );
      toast.message("Answered from the product model — live help unavailable.");
      return;
    }
    setAnswer(out.text);
  }

  return (
    <div>
      <PageHeader
        kicker="Support"
        title="Help"
        detail="How the product works, in the language of the work — not the architecture."
      />
      <TabBar tabs={[...HELP_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "start" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {gettingStarted.map((item) => (
            <Panel key={item.title} title={item.title}>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </Panel>
          ))}
        </div>
      ) : null}

      {tab === "guides" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((item) => (
            <Panel key={item.title} title={item.title}>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </Panel>
          ))}
        </div>
      ) : null}

      {tab === "ask" ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <Panel title="Ask about Practice Engine">
            <div className="mb-3 flex flex-wrap gap-2">
              {["How do I use Development?", "Why is this recommended?", "Explain my overall condition", "What does my practice score mean?"].map(
                (q) => (
                  <Button key={q} size="sm" variant="outline" onClick={() => void ask(q)}>
                    {q}
                  </Button>
                ),
              )}
            </div>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask how to use a feature" />
            <Button className="mt-3" disabled={busy} onClick={() => void ask()}>
              {busy ? "Thinking…" : "Ask"}
            </Button>
            {answer ? <p className="mt-4 text-sm">{answer}</p> : null}
          </Panel>
          <Panel title="This recommendation">
            <p className="text-sm font-medium">{next.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{next.why}</p>
            <p className="mt-2 text-xs text-muted-foreground">{next.action}</p>
            <p className="mt-4 text-sm">
              Overall condition: <span className="font-medium">{overall?.title}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{overall?.why}</p>
            <DashLink to={next.to} tab={next.tab} className="mt-4 inline-block text-sm text-primary">
              Do it
            </DashLink>
          </Panel>
        </div>
      ) : null}

      {tab === "support" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Report a problem">
            <Textarea value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="What broke, and what you expected" />
            <Button
              className="mt-3"
              onClick={() => {
                if (!ticket.trim()) return;
                toast.success("Report saved locally. In production this reaches support.");
                setTicket("");
              }}
            >
              Submit
            </Button>
          </Panel>
          <Panel title="Feedback">
            <p className="text-sm text-muted-foreground">
              Practice Engine is a connected coaching OS. If a screen feels like an internal engine, that is a product bug — tell us.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Contact: support@practiceengine.local</p>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
