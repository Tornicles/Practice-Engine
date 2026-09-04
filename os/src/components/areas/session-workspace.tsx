import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Panel } from "@/components/engine";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

export function SessionWorkspace() {
  const clients = useEngine((s) => s.clients);
  const sessions = useEngine((s) => s.sessions);
  const addDelivery = useEngine((s) => s.addDelivery);
  const addExperience = useEngine((s) => s.addExperience);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [plan, setPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [intervention, setIntervention] = useState("");
  const [response, setResponse] = useState("");
  const [outcome, setOutcome] = useState("");
  const [commitments, setCommitments] = useState("");

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
    });
    addExperience({
      title: `Session: ${objective.slice(0, 48)}`,
      sourceType: "session",
      situation: notes || context || objective,
      action: intervention,
      result: outcome,
      reflection: response,
      lesson: "Live delivery is the richest evidence source.",
      insight: "",
      validationStatus: "raw",
    });
    toast.success("Session saved. An experience candidate was captured — still raw.");
    setObjective("");
    setNotes("");
    setIntervention("");
    setResponse("");
    setOutcome("");
    setCommitments("");
  }

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
            {previous ? (
              <div className="border border-border p-3 text-xs">
                <div className="engine-kicker mb-1">Previous session</div>
                <p>{previous.objective}</p>
                <p className="mt-1 text-muted-foreground">{previous.outcome}</p>
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
            <Button onClick={save}>Save session + experience candidate</Button>
          </div>
        </Panel>
      </div>
      <Panel title="Session log" className="mt-6">
        <div className="space-y-3">
          {sessions.map((s) => {
            const client = clients.find((c) => c.id === s.clientId);
            return (
              <div key={s.id} className="border border-border p-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">{client?.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{fmtDate(s.date)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.objective}</p>
                <p className="mt-2 text-xs">Intervention: {s.intervention}</p>
                <p className="mt-1 text-xs text-muted-foreground">Response: {s.clientResponse}</p>
                <p className="mt-1 text-xs">Follow-up: {s.followUp}</p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
