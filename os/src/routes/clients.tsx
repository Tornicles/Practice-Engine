import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExperienceCapture } from "@/components/areas/experience-capture";
import { SessionWorkspace } from "@/components/areas/session-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Kpi, PageHeader, Panel, ProgressBar, StatusBadge, TabBar } from "@/components/engine";
import { clientProgramWeek } from "@/lib/compute";
import { CLIENT_TABS, parseTabSearch } from "@/lib/nav";
import { skillViews } from "@/lib/compute";
import { useEngine } from "@/lib/store";
import { dateInputValue, daysFromNow, fmtDate, isoFromDateInput } from "@/lib/utils";

export const Route = createFileRoute("/clients")({
  validateSearch: parseTabSearch,
  component: Clients,
});

function Clients() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "overview";
  const navigate = useNavigate({ from: "/clients" });
  const state = useEngine();
  const [selectedId, setSelectedId] = useState(state.clients[0]?.id ?? "");
  const [intakeGoal, setIntakeGoal] = useState("");
  const [intakeState, setIntakeState] = useState("");
  const [actionText, setActionText] = useState("");
  const client = state.clients.find((c) => c.id === selectedId) ?? state.clients[0];
  const history = state.sessions.filter((s) => s.clientId === client?.id);
  const skills = skillViews(state);
  const last = history[0];
  const week = client ? clientProgramWeek(state, client) : undefined;
  const [nextDate, setNextDate] = useState(dateInputValue(client?.nextSessionAt ?? daysFromNow(7)));
  const captureHint = useMemo(() => {
    if (!last) return undefined;
    return `After ${client?.name}: ${last.outcome}`;
  }, [last, client]);

  return (
    <div>
      <PageHeader
        kicker="Real-world application"
        title="Clients"
        detail="Goal, metrics, remaining sessions, and the next action. A sale is not a client until intake is done."
      />
      <TabBar tabs={[...CLIENT_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "overview" ? (
        <div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Active" value={state.clients.filter((c) => c.status === "active").length} />
            <Kpi label="New from sale" value={state.clients.filter((c) => c.status === "new").length} />
            <Kpi label="Sessions" value={state.sessions.length} />
            <Kpi label="Open actions" value={state.clients.reduce((n, c) => n + (c.actions?.filter((a) => !a.done).length ?? 0), 0)} />
            <Kpi label="Sessions left" value={state.clients.reduce((n, c) => n + (c.remainingSessions ?? 0), 0)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {state.clients.map((c) => {
              const sess = state.sessions.filter((s) => s.clientId === c.id);
              const pw = clientProgramWeek(state, c);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="engine-card p-4 text-left hover:border-primary/40"
                  onClick={() => {
                    setSelectedId(c.id);
                    setNextDate(dateInputValue(c.nextSessionAt ?? daysFromNow(7)));
                    void navigate({ search: { tab: "profile" } });
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.role}</p>
                  <p className="mt-3 text-sm">{c.objective}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{c.currentState}</p>
                  <p className="mt-3 font-mono text-[0.625rem] text-muted-foreground">
                    {sess.length} sessions · {c.remainingSessions ?? "—"} left · week {c.currentWeek ?? 1} {pw ? `· ${pw.title}` : ""}
                    {c.nextSessionAt ? ` · next ${fmtDate(c.nextSessionAt)}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "profile" && client ? (
        <div className="grid gap-4 lg:grid-cols-[.4fr_1fr]">
          <Panel title="Clients">
            <div className="space-y-2">
              {state.clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setNextDate(dateInputValue(c.nextSessionAt ?? daysFromNow(7)));
                  }}
                  className={`w-full border p-3 text-left text-sm ${c.id === client.id ? "border-primary bg-accent" : "border-border"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={client.name} action={<StatusBadge status={client.status} />}>
            {client.status === "new" ? (
              <div className="mb-6 space-y-3 border border-primary/40 p-3">
                <p className="text-sm">Intake required. This person is not active until a goal is set.</p>
                <Field label="Coaching goal">
                  <Input value={intakeGoal} onChange={(e) => setIntakeGoal(e.target.value)} placeholder="What must change" />
                </Field>
                <Field label="Current state">
                  <Input value={intakeState} onChange={(e) => setIntakeState(e.target.value)} placeholder="What is true now" />
                </Field>
                <Button
                  onClick={() => {
                    if (!intakeGoal.trim()) {
                      toast.error("A goal is required.");
                      return;
                    }
                    state.completeIntake(client.id, {
                      objective: intakeGoal.trim(),
                      currentState: intakeState.trim() || "Intake complete.",
                    });
                    toast.success("Client is now active.");
                    setIntakeGoal("");
                    setIntakeState("");
                  }}
                >
                  Complete intake
                </Button>
              </div>
            ) : null}
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="engine-kicker">Role</dt>
                <dd>{client.role}</dd>
              </div>
              <div>
                <dt className="engine-kicker">Sessions left</dt>
                <dd className="font-mono">
                  {client.remainingSessions ?? "—"} / {client.packageSessions ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="engine-kicker">Goals</dt>
                <dd>{client.objective}</dd>
              </div>
              <div>
                <dt className="engine-kicker">Package</dt>
                <dd>{client.packagePaid ? "Paid" : "Unpaid"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="engine-kicker">Current situation</dt>
                <dd>{client.currentState}</dd>
              </div>
            </dl>

            <div className="mt-6 border border-primary/30 p-3">
              <div className="engine-kicker text-primary">This week · program</div>
              <p className="mt-2 text-sm font-medium">
                Week {client.currentWeek ?? 1}: {week?.title ?? "No program"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{week?.activity}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Next session">
                <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
              </Field>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!nextDate) return;
                    state.bookNextSession(client.id, isoFromDateInput(nextDate));
                    toast.success("Next session booked.");
                  }}
                >
                  Book next
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex min-h-11 items-center gap-2 border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(client.packagePaid)}
                  onChange={(e) => state.markPackagePaid(client.id, e.target.checked)}
                />
                Package paid
              </label>
              <Button
                variant="outline"
                onClick={() => {
                  state.sendCheckIn(client.id);
                  toast.success("Check-in sent to Messages.");
                }}
              >
                Send check-in
              </Button>
            </div>

            <div className="engine-kicker mt-6 mb-2">What they see</div>
            <div className="border border-border p-3 text-sm">
              <p className="font-medium">{client.name}</p>
              <p className="mt-1 text-muted-foreground">
                {client.remainingSessions ?? 0} sessions remaining
                {client.nextSessionAt ? ` · next ${fmtDate(client.nextSessionAt)}` : " · no date booked"}
              </p>
              <p className="mt-2">{week ? `This week: ${week.activity}` : "No program activity."}</p>
              <ul className="mt-3 list-disc pl-4 text-xs">
                {(client.actions ?? [])
                  .filter((a) => !a.done)
                  .map((a) => (
                    <li key={a.id}>
                      {a.text} <span className="text-muted-foreground">({a.due})</span>
                    </li>
                  ))}
              </ul>
              {last?.worksheet ? (
                <p className="mt-3 text-xs text-muted-foreground">Last worksheet: {last.worksheet}</p>
              ) : null}
            </div>

            <div className="engine-kicker mt-6 mb-2">Metrics</div>
            {(client.metrics ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No metrics yet. Add them at intake or after a session.</p>
            ) : (
              <div className="space-y-3">
                {(client.metrics ?? []).map((m) => (
                  <div key={m.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{m.label}</span>
                      <span className="font-mono text-xs">
                        {m.value}
                        {m.unit === "%" ? "%" : ` ${m.unit}`} / {m.target}
                      </span>
                    </div>
                    <ProgressBar value={m.target === 0 ? 0 : Math.min(100, (m.value / Math.max(m.target, 1)) * 100)} />
                  </div>
                ))}
              </div>
            )}
            <div className="engine-kicker mt-6 mb-2">Actions</div>
            <div className="space-y-2">
              {(client.actions ?? []).map((a) => (
                <label key={a.id} className="flex min-h-11 items-start gap-3 border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={a.done}
                    onChange={() => state.toggleClientAction(client.id, a.id)}
                  />
                  <span className={a.done ? "text-muted-foreground line-through" : ""}>
                    {a.text}
                    <span className="mt-1 block font-mono text-[0.625rem] text-muted-foreground">{a.due}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="New between-session action"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (!actionText.trim()) return;
                  state.addClientAction(client.id, actionText.trim());
                  setActionText("");
                }}
              >
                Add action
              </Button>
            </div>
            <div className="engine-kicker mt-6 mb-2">History</div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              history.map((s) => (
                <div key={s.id} className="mb-2 border border-border p-3">
                  <div className="flex justify-between text-sm">
                    <span>{s.objective}</span>
                    <span className="font-mono text-xs text-muted-foreground">{fmtDate(s.date)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.outcome}</p>
                </div>
              ))
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "session" ? <SessionWorkspace /> : null}

      {tab === "outcomes" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.clients.map((c) => {
            const sess = state.sessions.filter((s) => s.clientId === c.id);
            return (
              <Panel key={c.id} title={c.name}>
                <div className="engine-kicker">Baseline</div>
                <p className="text-sm">{c.currentState}</p>
                <div className="engine-kicker mt-3">Progress</div>
                <p className="text-sm">{sess[0]?.outcome ?? "No measured change yet."}</p>
                {(c.metrics ?? []).map((m) => (
                  <p key={m.id} className="mt-1 font-mono text-xs text-muted-foreground">
                    {m.label}: {m.value}/{m.target} {m.unit}
                  </p>
                ))}
                <div className="engine-kicker mt-3">Evidence</div>
                <p className="text-sm text-muted-foreground">{sess[0]?.clientResponse ?? "—"}</p>
              </Panel>
            );
          })}
        </div>
      ) : null}

      {tab === "performance" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Skills demonstrated">
            {skills.map((sk) => (
              <div key={sk.key} className="mb-2 flex justify-between text-sm">
                <span>{sk.label}</span>
                <span className="font-mono">
                  {sk.current} · {sk.trend}
                </span>
              </div>
            ))}
          </Panel>
          <Panel title="Session patterns">
            {state.practices[0] ? (
              <>
                <p className="text-sm font-medium">Strengths</p>
                <p className="text-sm text-muted-foreground">{state.practices[0].strengths}</p>
                <p className="mt-3 text-sm font-medium">Weaknesses / missed opportunities</p>
                <p className="text-sm text-muted-foreground">{state.practices[0].weaknesses}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Run a session or simulation to see patterns.</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Live client work is the development loop: session → learning → better client work.
            </p>
          </Panel>
        </div>
      ) : null}

      {tab === "capture" ? (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            After a session: reflection → lesson → pattern → principle → evidence.
          </p>
          <ExperienceCapture sourceHint={captureHint} />
        </div>
      ) : null}
    </div>
  );
}
