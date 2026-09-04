import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Panel, StatusBadge } from "@/components/engine";
import { evaluatePractice, simulateClientTurn } from "@/lib/ai";
import { heuristicScore } from "@/lib/compute";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import type { SkillKey } from "@/lib/types";

const scenarios = [
  {
    id: "res",
    title: "The Resistant Executive",
    tag: "Resistance",
    prompt: "I've heard all of this before. I don't think coaching is going to change anything.",
    skill: "challenge" as SkillKey,
  },
  {
    id: "stuck",
    title: "The Stuck Client",
    tag: "Avoidance",
    prompt: "I know what I need to do. I just don't understand why you're asking me all these questions.",
    skill: "questioning" as SkillKey,
  },
  {
    id: "buy",
    title: "The Skeptical Buyer",
    tag: "Discovery",
    prompt: "Explain why your methodology is worth this price. We've tried coaches.",
    skill: "listening" as SkillKey,
  },
];

export function PracticeStudio() {
  const practices = useEngine((s) => s.practices);
  const addPractice = useEngine((s) => s.addPractice);
  const logAi = useEngine((s) => s.logAi);
  const drills = useEngine((s) => s.drills);
  const [active, setActive] = useState<(typeof scenarios)[0] | null>(null);
  const [history, setHistory] = useState<{ role: "coach" | "client"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(ReturnType<typeof heuristicScore> & { strengths: string; weaknesses: string }) | null>(
    null,
  );

  async function start(s: (typeof scenarios)[0]) {
    setActive(s);
    setResult(null);
    setHistory([{ role: "client", text: s.prompt }]);
    setDraft("");
  }

  async function send() {
    if (!active || !draft.trim()) return;
    const next = [...history, { role: "coach" as const, text: draft.trim() }];
    setHistory(next);
    setDraft("");
    setBusy(true);
    const reply = await simulateClientTurn({ data: { scenario: `${active.title}: ${active.prompt}`, history: next } });
    const clientText = reply.ok
      ? reply.text
      : "I'm not sure that helps. What exactly do you want me to do differently this week?";
    logAi({
      actionType: "simulate",
      targetEngine: "development",
      strategy: "Simulate",
      evidenceStatus: reply.ok ? "observational" : "candidate",
    });
    setHistory([...next, { role: "client", text: clientText }]);
    setBusy(false);
  }

  async function closeSession() {
    if (!active) return;
    setBusy(true);
    const evalRes = await evaluatePractice({ data: { scenario: active.title, history } });
    const h = heuristicScore(
      history
        .filter((t) => t.role === "coach")
        .map((t) => t.text)
        .join(" "),
    );
    const scores = evalRes.ok
      ? {
          overall: evalRes.overall,
          listening: evalRes.listening,
          questioning: evalRes.questioning,
          reframing: evalRes.reframing,
          challenge: evalRes.challenge,
        }
      : h;
    const strengths = evalRes.ok ? evalRes.strengths : "You stayed in the conversation.";
    const weaknesses = evalRes.ok ? evalRes.weaknesses : "Diagnosis may still be arriving after advice.";
    addPractice({
      scenario: active.title,
      skill: active.skill,
      difficulty: 3,
      turns: history,
      scores,
      strengths,
      weaknesses,
    });
    logAi({
      actionType: "evaluate",
      targetEngine: "development",
      strategy: "Evaluate",
      evidenceStatus: "testing",
    });
    setResult({ ...scores, strengths, weaknesses });
    setBusy(false);
    toast.success("Practice saved as evidence — not as mastery.");
  }

  if (active) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <div className="engine-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="engine-kicker">{active.tag}</div>
              <h2 className="text-base font-semibold">{active.title}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActive(null)}>
              Exit
            </Button>
          </div>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {history.map((turn, i) => (
              <div
                key={i}
                className={
                  turn.role === "coach"
                    ? "ml-8 border border-primary/30 bg-accent p-3 text-sm"
                    : "mr-8 border border-border bg-secondary p-3 text-sm"
                }
              >
                <div className="engine-kicker mb-1">{turn.role}</div>
                {turn.text}
              </div>
            ))}
          </div>
          {result ? (
            <div className="mt-4 border border-border p-3 text-sm">
              <div className="font-mono text-primary">Overall {result.overall}</div>
              <p className="mt-2 text-muted-foreground">{result.strengths}</p>
              <p className="mt-1 text-muted-foreground">{result.weaknesses}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Coach response" />
              <div className="flex gap-2">
                <Button onClick={() => void send()} disabled={busy || !draft.trim()}>
                  {busy ? "Client is responding…" : "Send"}
                </Button>
                <Button variant="outline" onClick={() => void closeSession()} disabled={busy || history.length < 2}>
                  Evaluate
                </Button>
              </div>
            </div>
          )}
        </div>
        <Panel title="What this scores">
          <p className="text-sm text-muted-foreground">
            Listening, questioning, reframing, challenge. Recency-weighted into your skill picture. One good session is
            not mastery.
          </p>
          <div className="mt-3">
            <StatusBadge status="testing" />
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <>
      {drills[0] ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Prescribed: {drills[0].name} — from your current diagnostic protocol, not a random lesson.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <div key={s.id} className="engine-card p-5">
            <div className="engine-kicker text-primary">{s.tag}</div>
            <h2 className="mt-2 text-base font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">“{s.prompt}”</p>
            <Button className="mt-4" onClick={() => void start(s)}>
              Enter simulation
            </Button>
          </div>
        ))}
      </div>
      <Panel title="Practice history" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="engine-kicker text-muted-foreground">
              <tr>
                <th className="pb-2">Scenario</th>
                <th className="pb-2">Skill</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">When</th>
              </tr>
            </thead>
            <tbody>
              {practices.slice(0, 8).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2">{p.scenario}</td>
                  <td className="py-2 capitalize">{p.skill}</td>
                  <td className="py-2 font-mono tabular-nums text-primary">{p.scores.overall}</td>
                  <td className="py-2 text-muted-foreground">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
