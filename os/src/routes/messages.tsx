import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader, Panel, StatusBadge, TabBar } from "@/components/engine";
import { draftReply } from "@/lib/ai";
import { dueCheckIns } from "@/lib/compute";
import { MESSAGE_TABS, parseTabSearch } from "@/lib/nav";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import type { MessageChannel } from "@/lib/types";

export const Route = createFileRoute("/messages")({
  validateSearch: parseTabSearch,
  component: Messages,
});

function Messages() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "inbox";
  const navigate = useNavigate({ from: "/messages" });
  const threads = useEngine((s) => s.threads);
  const sendMessage = useEngine((s) => s.sendMessage);
  const markThreadRead = useEngine((s) => s.markThreadRead);
  const convertThreadToFollowUp = useEngine((s) => s.convertThreadToFollowUp);
  const style = useEngine((s) => s.settings.generationStyle);
  const checkIns = useMemo(() => dueCheckIns(threads), [threads]);
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    if (tab === "clients") return threads.filter((t) => t.channel === "client");
    if (tab === "leads") return threads.filter((t) => t.channel === "lead");
    if (tab === "network") return threads.filter((t) => t.channel === "network");
    return threads;
  }, [tab, threads]);

  const active = filtered.find((t) => t.id === activeId) ?? filtered[0];

  async function assist(kind: "draft" | "summarize" | "followup" | "commitment" | "opportunity" | "action") {
    if (!active) return;
    if (kind === "followup" || kind === "action") {
      const ok = convertThreadToFollowUp(active.id);
      if (ok) toast.success("Turned into a follow-up on Home.");
      else toast.error("Today is full. Finish or drop a job before adding another (cap is 3).");
      return;
    }
    if (kind === "commitment") {
      const last = active.messages.filter((m) => m.from === "them").at(-1);
      toast.message(last ? `Possible commitment: “${last.text.slice(0, 80)}”` : "No client message to extract.");
      return;
    }
    if (kind === "opportunity") {
      toast.message(active.channel === "lead" ? "This is already a prospect conversation." : "Not a commercial thread.");
      return;
    }
    setBusy(true);
    const history = active.messages.map((m) => `${m.from === "coach" ? "You" : active.withName}: ${m.text}`).join("\n");
    const out = await draftReply({
      data: {
        withName: active.withName,
        subject: kind === "summarize" ? `Summarize: ${active.subject}` : active.subject,
        history,
        style,
      },
    });
    setBusy(false);
    if (!out.ok) {
      setDraft(
        kind === "summarize"
          ? `${active.withName} is waiting on ${active.subject.toLowerCase()}.`
          : `Jordan — I heard the board, not the candidate. Keep the 48-hour rule. Tell me what happens before the next offer.`,
      );
      toast.message("Drafted locally — model unavailable.");
      return;
    }
    setDraft(out.text);
  }

  return (
    <div>
      <PageHeader
        kicker="Communication"
        title="Messages"
        detail="Clients, leads, and your network. A conversation can become a follow-up, a commitment, or an action — it is not a twelfth dashboard."
      />
      <TabBar tabs={[...MESSAGE_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "assist" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { id: "draft" as const, title: "Draft response", detail: "Write a short diagnostic reply." },
            { id: "summarize" as const, title: "Summarize conversation", detail: "What is actually pending." },
            { id: "followup" as const, title: "Identify follow-up", detail: "Push the thread onto Home." },
            { id: "commitment" as const, title: "Extract commitment", detail: "Name what they said they would do." },
            { id: "opportunity" as const, title: "Identify opportunity", detail: "Is this a commercial conversation?" },
            { id: "action" as const, title: "Convert to an action", detail: "Conversation → signal → next move." },
          ].map((a) => (
            <button
              key={a.id}
              type="button"
              className="engine-card p-4 text-left hover:border-primary/40"
              onClick={() => {
                void navigate({ search: { tab: "inbox" } });
                void assist(a.id);
              }}
            >
              <div className="text-sm font-semibold">{a.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[.38fr_1fr]">
          <Panel title={tab === "inbox" ? "Inbox" : tab}>
            {tab === "inbox" && checkIns.length > 0 ? (
              <div className="mb-3 border border-primary/40 p-3">
                <div className="engine-kicker text-primary">Due check-ins</div>
                {checkIns.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="mt-2 block w-full text-left text-sm hover:text-primary"
                    onClick={() => {
                      setActiveId(t.id);
                      markThreadRead(t.id);
                    }}
                  >
                    {t.withName} · {t.subject}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="space-y-2">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveId(t.id);
                    markThreadRead(t.id);
                  }}
                  className={`w-full border p-3 text-left ${active?.id === t.id ? "border-primary bg-accent" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{t.withName}</span>
                    <div className="flex items-center gap-1">
                      {t.kind === "checkin" ? <StatusBadge status="check-in" /> : null}
                      {t.priority ? <StatusBadge status="high" /> : null}
                      {t.unread > 0 ? (
                        <span className="font-mono text-[0.625rem] text-primary">{t.unread}</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t.subject}</p>
                </button>
              ))}
            </div>
          </Panel>
          {active ? (
            <div className="engine-card flex min-h-[28rem] flex-col p-4">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-semibold">{active.withName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {active.withRole} · {channelLabel(active.channel)}
                    {active.kind === "checkin" ? " · check-in" : ""}
                  </p>
                  <p className="mt-1 text-sm">{active.subject}</p>
                </div>
                {active.relatedClientId ? (
                  <DashLink to="/clients" tab="profile" className="text-xs text-primary">
                    Open client
                  </DashLink>
                ) : null}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.from === "coach"
                        ? "ml-8 border border-primary/30 bg-accent p-3 text-sm"
                        : "mr-8 border border-border bg-secondary p-3 text-sm"
                    }
                  >
                    <div className="engine-kicker mb-1">
                      {m.from === "coach" ? "You" : active.withName} · {fmtDate(m.at)}
                    </div>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply" />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      if (!draft.trim()) return;
                      sendMessage(active.id, draft);
                      setDraft("");
                      toast.success("Sent.");
                    }}
                  >
                    Send
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => void assist("draft")}>
                    {busy ? "Drafting…" : "Draft response"}
                  </Button>
                  <Button variant="ghost" onClick={() => void assist("followup")}>
                    Convert to action
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Panel title="Conversation">
              <p className="text-sm text-muted-foreground">No conversations in this view.</p>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function channelLabel(channel: MessageChannel) {
  if (channel === "client") return "Client";
  if (channel === "lead") return "Lead";
  return "Network";
}
