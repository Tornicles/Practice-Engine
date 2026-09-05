import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Panel } from "@/components/engine";
import { useEngine } from "@/lib/store";
import { dateInputValue, daysFromNow, fmtDate, isoFromDateInput } from "@/lib/utils";

export function SessionWorkspace() {
  const clients = useEngine((s) => s.clients);
  const sessions = useEngine((s) => s.sessions);
  const addDelivery = useEngine((s) => s.addDelivery);
  const addExperience = useEngine((s) => s.addExperience);
  const bookNextSession = useEngine((s) => s.bookNextSession);
  const captureLessonFromSession = useEngine((s) => s.captureLessonFromSession);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [plan, setPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [intervention, setIntervention] = useState("");
  const [response, setResponse] = useState("");
  const [outcome, setOutcome] = useState("");
  const [commitments, setCommitments] = useState("");
  const [questionsAsked, setQuestionsAsked] = useState("3");
  const [challengeTiming, setChallengeTiming] = useState<"early" | "on_time" | "late" | "none">("on_time");
  const [worksheet, setWorksheet] = useState("");
  const [talk, setTalk] = useState("40");
  const [moments, setMoments] = useState("");
  const [nextDate, setNextDate] = useState(dateInputValue(daysFromNow(7)));

  function generatePlan() {
    const client = clients.find((c) => c.id === clientId);
    const previous = sessions.find((s) => s.clientId === clientId);
    setPlan(
      `Review previous: ${previous?.outcome ?? "no prior session logged"}.\nPrepare: ${client?.name ?? "client"} — ${client?.currentState ?? "unknown"}.\nExplore: what is the real audience for this decision?\nDiagnose: ownership vs motivation.\nIntervene: one diagnostic pair, then one timed challenge.\nClose: a test that can be verified before the next session.`,
    );
  }

  function save() {
    if (!objective || !intervention) {
      toast.error("Objective and intervention are required.");
      return;
    }
    addDelivery({
      clientId,
      date: new Date().toISOString(),
      objective,
      notes: notes || context,
      intervention,
      clientResponse: response,
      outcome,
      followUp: commitments || "Verify the committed test.",
      questionsAsked: Number(questionsAsked) || 0,
      challengeTiming,
      clientCommitment: commitments,
      worksheet: worksheet || commitments,
      coachSpeakPercent: Number(talk) || 0,
      moments: moments
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    });
    addExperience({
      title: `Session: ${objective.slice(0, 48)}`,
      sourceType: "session",
      situation: notes || context || objective,
      action: intervention,
      result: outcome,
      reflection: response,
      lesson: "Live delivery is the richest evidence source.",
      insight: moments,
      validationStatus: "raw",
    });
    if (nextDate) bookNextSession(clientId, isoFromDateInput(nextDate));
    toast.success("Session saved. Worksheet is an open action. Check-in is in Messages.");
    setObjective("");
    setNotes("");
    setIntervention("");
    setResponse("");
    setOutcome("");
    setCommitments("");
    setWorksheet("");
    setMoments("");
  }

  const client = clients.find((c) => c.id === clientId);
  const previous = sessions.find((s) => s.clientId === clientId);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Prepare">
          <div className="space-y-3">
            <Field label="Client">
              <select
                className="engine-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Session objective">
              <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
            </Field>
            <Field label="Current situation">
              <Textarea value={context} onChange={(e) => setContext(e.target.value)} />
            </Field>
            {client ? (
              <p className="text-xs text-muted-foreground">
                {client.remainingSessions ?? "—"} sessions left · week {client.currentWeek ?? 1} ·{" "}
                {(client.actions ?? []).filter((a) => !a.done).length} open actions
                {client.nextSessionAt ? ` · next ${fmtDate(client.nextSessionAt)}` : ""}
              </p>
            ) : null}
            {previous ? (
              <div className="border border-border p-3 text-xs">
                <div className="engine-kicker mb-1">Previous session</div>
                <p>{previous.objective}</p>
                <p className="mt-1 text-muted-foreground">{previous.outcome}</p>
                {previous.coachSpeakPercent != null ? (
                  <p className="mt-1 font-mono text-muted-foreground">Coach speak {previous.coachSpeakPercent}%</p>
                ) : null}
              </div>
            ) : null}
            <Button variant="outline" onClick={generatePlan}>
              Generate session plan
            </Button>
            {plan ? <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{plan}</pre> : null}
          </div>
        </Panel>
        <Panel title="During / after">
          <div className="space-y-3">
            <Field label="Observations">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Field label="Interventions">
              <Textarea value={intervention} onChange={(e) => setIntervention(e.target.value)} />
            </Field>
            <Field label="Client responses">
              <Textarea value={response} onChange={(e) => setResponse(e.target.value)} />
            </Field>
            <Field label="Outcomes">
              <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </Field>
            <Field label="Commitments">
              <Input value={commitments} onChange={(e) => setCommitments(e.target.value)} />
            </Field>
            <Field label="Worksheet to the client (one action)">
              <Textarea
                value={worksheet}
                onChange={(e) => setWorksheet(e.target.value)}
                placeholder="One thing they do before the next session."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Questions asked">
                <Input
                  inputMode="numeric"
                  value={questionsAsked}
                  onChange={(e) => setQuestionsAsked(e.target.value)}
                />
              </Field>
              <Field label="Challenge timing">
                <select
                  className="engine-select"
                  value={challengeTiming}
                  onChange={(e) => setChallengeTiming(e.target.value as typeof challengeTiming)}
                >
                  <option value="none">none</option>
                  <option value="early">early</option>
                  <option value="on_time">on time</option>
                  <option value="late">late</option>
                </select>
              </Field>
              <Field label="Coach speak %">
                <Input inputMode="numeric" value={talk} onChange={(e) => setTalk(e.target.value)} />
              </Field>
              <Field label="Book next">
                <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Moments (comma separated)">
              <Input
                value={moments}
                onChange={(e) => setMoments(e.target.value)}
                placeholder="named the stall, board as hidden client"
              />
            </Field>
            <Button onClick={save}>Save session + worksheet</Button>
          </div>
        </Panel>
      </div>
      <Panel title="Session log" className="mt-6">
        <div className="space-y-3">
          {sessions.map((s) => {
            const rowClient = clients.find((c) => c.id === s.clientId);
            return (
              <div key={s.id} className="border border-border p-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">{rowClient?.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{fmtDate(s.date)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.objective}</p>
                <p className="mt-2 text-xs">Intervention: {s.intervention}</p>
                <p className="mt-1 text-xs text-muted-foreground">Response: {s.clientResponse}</p>
                <p className="mt-1 text-xs">Follow-up: {s.followUp}</p>
                {s.coachSpeakPercent != null ? (
                  <p className="mt-1 font-mono text-[0.625rem] text-muted-foreground">
                    Coach speak {s.coachSpeakPercent}% · Q {s.questionsAsked ?? "—"} · challenge {s.challengeTiming ?? "—"}
                  </p>
                ) : null}
                {(s.moments ?? []).length ? (
                  <p className="mt-1 text-xs text-muted-foreground">Moments: {(s.moments ?? []).join(" · ")}</p>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    const id = captureLessonFromSession(s.id);
                    toast.success(id ? "Lesson drafted in Content." : "Could not capture.");
                  }}
                >
                  This session is the lesson
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
