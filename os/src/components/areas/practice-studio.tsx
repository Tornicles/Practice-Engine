import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Panel } from "@/components/engine";
import { PRACTICE_CATALOG } from "@/lib/catalog";
import { evaluatePractice, simulateClientTurn } from "@/lib/ai";
import { heuristicScore } from "@/lib/compute";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import type { PracticeScenario } from "@/lib/catalog";
import type { RubricMark } from "@/lib/types";

export function PracticeStudio() {
  const practices = useEngine((s) => s.practices);
  const addPractice = useEngine((s) => s.addPractice);
  const logAi = useEngine((s) => s.logAi);
  const drills = useEngine((s) => s.drills);
  const [active, setActive] = useState<PracticeScenario | null>(null);
  const [history, setHistory] = useState<{ role: "coach" | "client"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(ReturnType<typeof heuristicScore> & { strengths: string; weaknesses: string }) | null>(
    null,
  );
  const [marks, setMarks] = useState<RubricMark[]>([]);
  const [saved, setSaved] = useState(false);

  async function start(s: PracticeScenario) {
    setActive(s);
    setResult(null);
    setSaved(false);
    setMarks(s.rubric.map((item) => ({ item, hit: false })));
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
    setResult({ ...scores, strengths, weaknesses });
    setBusy(false);
  }

  function saveEvidence() {
    if (!active || !result) return;
    addPractice({
      scenario: active.title,
      skill: active.skill,
      difficulty: active.difficulty,
      turns: history,
      scores: {
        overall: result.overall,
        listening: result.listening,
        questioning: result.questioning,
        reframing: result.reframing,
        challenge: result.challenge,
      },
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      rubricMarks: marks,
    });
    logAi({
      actionType: "evaluate",
      targetEngine: "development",
      strategy: "Evaluate",
      evidenceStatus: "testing",
    });
    toast.success("Practice saved as evidence — not as mastery.");
    setSaved(true);
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
          <ul className="mb-3 list-disc pl-4 text-xs text-muted-foreground">
            {active.rubric.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
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
              <div className="engine-kicker mt-4 mb-2">Rubric</div>
              <div className="space-y-2">
                {marks.map((m, i) => (
                  <label key={m.item} className="flex min-h-11 items-start gap-3 border border-border p-2">
                    <input
                      type="checkbox"
                      checked={m.hit}
                      onChange={() =>
                        setMarks((prev) => prev.map((x, idx) => (idx === i ? { ...x, hit: !x.hit } : x)))
                      }
                    />
                    <span>{m.item}</span>
                  </label>
                ))}
              </div>
              <Button className="mt-3" onClick={saveEvidence} disabled={saved}>
                {saved ? "Saved" : "Save evidence"}
              </Button>
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
        <Panel title="Scorecard">
          <p className="text-sm text-muted-foreground">
            {active.minutes} min · {active.skill} · difficulty {active.difficulty}/5
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {active.rubric.map((r) => (
              <li key={r} className="border border-border p-2">
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Eight scenarios. Four skills. Last score is evidence, not mastery.
        {drills[0] ? ` Prescribed today: ${drills[0].name}.` : ""}
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PRACTICE_CATALOG.map((s) => {
          const last = practices.find((p) => p.scenario === s.title);
          const hits = last?.rubricMarks?.filter((m) => m.hit).length;
          return (
            <div key={s.id} className="engine-card flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="engine-kicker text-primary">{s.tag}</div>
                {last ? <span className="font-mono text-xs text-primary">{last.scores.overall}</span> : null}
              </div>
              <h2 className="mt-2 text-base font-semibold">{s.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">“{s.prompt}”</p>
              <p className="mt-2 font-mono text-[0.625rem] text-muted-foreground">
                {s.minutes} min · {s.skill}
                {hits != null ? ` · rubric ${hits}/${last?.rubricMarks?.length ?? 3}` : ""}
              </p>
              <Button className="mt-4 min-h-11" onClick={() => void start(s)}>
                {last ? "Repeat drill" : "Enter simulation"}
              </Button>
            </div>
          );
        })}
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
