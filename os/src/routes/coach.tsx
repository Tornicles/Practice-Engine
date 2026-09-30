import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AreaLink, EmptyState, PageHeader, Panel, TabBar } from "@/components/engine";
import { adaptForOccupation, coachChat, occupationAdaptation } from "@/lib/ai";
import { COACH_TABS, parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { MEDICAL_DISCLAIMER, PERSONA_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({
  validateSearch: parseTabSearch,
  component: Coach,
});

function Coach() {
  const [tab, setTab] = useState("chat");
  return (
    <div>
      <PageHeader
        kicker="Coach"
        title="Ask Forge"
        detail="Your AI trainer. It suggests — you decide. Nothing here is medical advice."
      />
      <TabBar tabs={[...COACH_TABS]} value={tab} onChange={setTab} />
      {tab === "chat" ? <Chat /> : <PlansHub />}
      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
    </div>
  );
}

interface Msg {
  from: "you" | "forge";
  text: string;
}

function Chat() {
  const state = useForge();
  const [messages, setMessages] = useState<Msg[]>([
    { from: "forge", text: `Hey ${state.profile.name.split(" ")[0]}. I'm Forge — ask me about training, food, running, or your schedule. I suggest, you decide.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const context = [
    `Goal: ${state.profile.goalDetail}`,
    `Level: ${state.profile.fitnessLevel}`,
    `Work: ${state.occupation.workType}, ${state.occupation.hoursPerDay}h/day`,
    `Injuries: ${state.profile.injuries || "none"}`,
    `Active plan: ${state.workoutPlans.find((p) => p.id === state.activePlanId)?.title ?? "none"}`,
    `Recent: ${state.workoutSessions.slice(0, 3).map((s) => `${s.title} (${s.difficulty ?? "unrated"})`).join("; ") || "no sessions yet"}`,
  ].join(" | ");

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { from: "you", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await coachChat({ data: { message: text, context, persona: state.settings.coachPersona } });
      setMessages((m) => [
        ...m,
        res.ok
          ? { from: "forge", text: (res as { ok: true; text: string }).text }
          : { from: "forge", text: `I'm offline right now (${res.error}). Try the templates in Train, Fuel, or Run — they work without me.` },
      ]);
    } finally {
      setBusy(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Panel title={`Forge · ${PERSONA_LABELS[state.settings.coachPersona]} mode`}>
        <div className="mb-4 max-h-[50vh] space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={cn("max-w-[85%] rounded-md p-3 text-sm", m.from === "you" ? "ml-auto bg-secondary" : "border border-border bg-card")}>
              <div className="engine-kicker mb-1">{m.from === "you" ? "You" : "Forge"}</div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            className="engine-select !h-10 flex-1 !w-auto"
            placeholder="e.g. My knee aches — what should I do today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }}
          />
          <Button onClick={() => void send()} disabled={busy}>{busy ? "…" : "Send"}</Button>
        </div>
      </Panel>
    </div>
  );
}

function PlansHub() {
  const state = useForge();
  const adaptPlanNote = useForge((s) => s.adaptPlanNote);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const plan = state.workoutPlans.find((p) => p.id === state.activePlanId);

  const adapt = async () => {
    setBusy(true);
    try {
      const fallback = occupationAdaptation(state.occupation);
      const res = await adaptForOccupation({
        data: {
          workType: state.occupation.workType,
          hoursPerDay: state.occupation.hoursPerDay,
          planTitle: plan?.title ?? "general training",
        },
      });
      const text = res.ok ? (res as { ok: true; text: string }).text : `${fallback}\n\n(AI offline — heuristic applied.)`;
      setNote(text);
      if (plan) adaptPlanNote(plan.id, text.split("\n")[0]);
      toast.success("Work adaptation applied to your active plan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="Work-aware programming">
        <p className="text-sm text-muted-foreground">
          Your job shapes your training. {state.occupation.workType === "sedentary" ? "Desk work" : state.occupation.workType} · {state.occupation.hoursPerDay}h/day.
          Forge adapts session length, timing, and intensity around it.
        </p>
        <Button className="mt-3" size="sm" onClick={() => void adapt()} disabled={busy || !plan}>
          {busy ? "Adapting…" : "Adapt my active plan for my work"}
        </Button>
        {note ? <p className="mt-3 whitespace-pre-wrap text-sm">{note}</p> : null}
        {!plan ? <p className="mt-2 text-xs text-muted-foreground">Activate a workout plan first.</p> : null}
      </Panel>

      <Panel title="Generators">
        <div className="grid gap-3 sm:grid-cols-3">
          <AreaLink to="/train" tab="plans" className="engine-card block p-4 hover:border-primary/40">
            <div className="engine-kicker text-primary">Train</div>
            <div className="mt-1 text-sm font-semibold">Workout generator</div>
            <p className="mt-1 text-xs text-muted-foreground">AI or template sessions from your equipment.</p>
          </AreaLink>
          <AreaLink to="/fuel" tab="groceries" className="engine-card block p-4 hover:border-primary/40">
            <div className="engine-kicker text-primary">Fuel</div>
            <div className="mt-1 text-sm font-semibold">Meal generator</div>
            <p className="mt-1 text-xs text-muted-foreground">Meals from your grocery photos.</p>
          </AreaLink>
          <AreaLink to="/run" tab="plan" className="engine-card block p-4 hover:border-primary/40">
            <div className="engine-kicker text-primary">Run</div>
            <div className="mt-1 text-sm font-semibold">Run plan generator</div>
            <p className="mt-1 text-xs text-muted-foreground">Walk/run progressions to 5K and beyond.</p>
          </AreaLink>
        </div>
      </Panel>

      {state.workoutPlans.filter((p) => p.status === "draft").length === 0 &&
      state.runPlans.filter((p) => p.status === "draft").length === 0 ? (
        <EmptyState title="No pending drafts" detail="Every AI suggestion lands here first. Confirm one to make it active." />
      ) : (
        <Panel title="Drafts awaiting your decision">
          <ul className="space-y-2">
            {state.workoutPlans.filter((p) => p.status === "draft").map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{p.title} <span className="text-muted-foreground">· workout</span></span>
                <AreaLink to="/train" tab="plans" className="text-xs font-medium text-primary hover:underline">Review →</AreaLink>
              </li>
            ))}
            {state.runPlans.filter((p) => p.status === "draft").map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{p.title} <span className="text-muted-foreground">· run plan</span></span>
                <AreaLink to="/run" tab="plan" className="text-xs font-medium text-primary hover:underline">Review →</AreaLink>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
