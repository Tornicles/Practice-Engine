import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExperienceCapture } from "@/components/areas/experience-capture";
import { SessionWorkspace } from "@/components/areas/session-workspace";
import { Kpi, PageHeader, Panel, StatusBadge, TabBar } from "@/components/engine";
import { CLIENT_TABS, parseTabSearch } from "@/lib/nav";
import { skillViews } from "@/lib/compute";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/clients")({
  validateSearch: parseTabSearch,
  component: Clients,
});

function Clients() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "overview";
  const navigate = useNavigate({ from: "/clients" });
  const state = useEngine();
  const [selectedId, setSelectedId] = useState(state.clients[0]?.id ?? "");
  const client = state.clients.find((c) => c.id === selectedId) ?? state.clients[0];
  const history = state.sessions.filter((s) => s.clientId === client?.id);
  const skills = skillViews(state);
  const last = history[0];
  const captureHint = useMemo(() => {
    if (!last) return undefined;
    return `After ${client?.name}: ${last.outcome}`;
  }, [last, client]);

  return (
    <div>
      <PageHeader
        kicker="Real-world application"
        title="Clients"
        detail="Prepare, run, and learn from live work. Client rooms feed development, expertise, and better sessions — they are not a CRM graveyard."
      />
      <TabBar tabs={[...CLIENT_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "overview" ? (
        <div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Active" value={state.clients.filter((c) => c.status === "active").length} />
            <Kpi label="Sessions" value={state.sessions.length} />
            <Kpi label="Follow-ups" value={state.sessions.filter((s) => s.followUp).length} />
            <Kpi label="Unread" value={state.threads.filter((t) => t.channel === "client" && t.unread > 0).length} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {state.clients.map((c) => {
              const sess = state.sessions.filter((s) => s.clientId === c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="engine-card p-4 text-left hover:border-primary/40"
                  onClick={() => {
                    setSelectedId(c.id);
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
                    {sess.length} sessions · last {sess[0] ? fmtDate(sess[0].date) : "—"}
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
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full border p-3 text-left text-sm ${c.id === client.id ? "border-primary bg-accent" : "border-border"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={client.name} action={<StatusBadge status={client.status} />}>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="engine-kicker">Role</dt>
                <dd>{client.role}</dd>
              </div>
              <div>
                <dt className="engine-kicker">Goals</dt>
                <dd>{client.objective}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="engine-kicker">Current situation</dt>
                <dd>{client.currentState}</dd>
              </div>
            </dl>
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
