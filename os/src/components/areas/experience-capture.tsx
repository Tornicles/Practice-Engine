import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, Field, StatusBadge } from "@/components/engine";
import { extractExperience } from "@/lib/ai";
import { useEngine } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

export function ExperienceCapture({ sourceHint }: { sourceHint?: string }) {
  const experiences = useEngine((s) => s.experiences);
  const principles = useEngine((s) => s.principles);
  const addExperience = useEngine((s) => s.addExperience);
  const addPrincipleCandidate = useEngine((s) => s.addPrincipleCandidate);
  const logAi = useEngine((s) => s.logAi);
  const [open, setOpen] = useState(Boolean(sourceHint));
  const [situation, setSituation] = useState(sourceHint ?? "");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState<{
    title: string;
    lesson: string;
    principle: string;
    insight: string;
    frameworkCandidate: string;
    evidenceGap: string;
  } | null>(null);

  async function extract() {
    if (!situation || !reflection) {
      toast.error("Situation and reflection are required.");
      return;
    }
    setBusy(true);
    const out = await extractExperience({ data: { situation, action, result, reflection } });
    setBusy(false);
    if (!out.ok) {
      setExtracted({
        title: situation.slice(0, 48) || "Captured experience",
        lesson: reflection,
        principle: "Candidate: diagnosis should precede prescription.",
        insight: result,
        frameworkCandidate: "",
        evidenceGap: "Needs a second supporting experience.",
      });
      logAi({
        actionType: "extract",
        targetEngine: "development",
        strategy: "Structure",
        evidenceStatus: "candidate",
      });
      toast.message("AI unavailable — structured as a candidate, not as truth.");
      return;
    }
    setExtracted(out);
    logAi({
      actionType: "extract",
      targetEngine: "development",
      strategy: "Structure",
      evidenceStatus: "candidate",
    });
  }

  function save() {
    if (!extracted) return;
    addExperience({
      title: extracted.title,
      sourceType: "manual",
      situation,
      action,
      result,
      reflection,
      lesson: extracted.lesson,
      insight: extracted.insight,
      frameworkCandidate: extracted.frameworkCandidate,
      evidenceGap: extracted.evidenceGap,
      validationStatus: "candidate",
    });
    if (extracted.principle) {
      addPrincipleCandidate(extracted.principle, extracted.lesson);
    }
    toast.success("Saved as a candidate. It is not validated expertise.");
    setOpen(false);
    setExtracted(null);
    setSituation("");
    setAction("");
    setResult("");
    setReflection("");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Session → reflection → lesson → pattern → principle → evidence. You remain the authority.
        </p>
        <Button onClick={() => setOpen(true)}>Capture experience</Button>
      </div>
      {open ? (
        <div className="engine-card mb-6 p-5">
          <h2 className="text-sm font-semibold">{extracted ? "Review extraction" : "Raw capture"}</h2>
          {!extracted ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="What happened?">
                <Textarea value={situation} onChange={(e) => setSituation(e.target.value)} />
              </Field>
              <Field label="What did you do?">
                <Textarea value={action} onChange={(e) => setAction(e.target.value)} />
              </Field>
              <Field label="What was the result?">
                <Textarea value={result} onChange={(e) => setResult(e.target.value)} />
              </Field>
              <Field label="What do you think it means?">
                <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} />
              </Field>
              <div className="flex gap-2 md:col-span-2">
                <Button onClick={() => void extract()} disabled={busy}>
                  {busy ? "Extracting…" : "Extract candidates"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <Field label="Title">
                <Input value={extracted.title} onChange={(e) => setExtracted({ ...extracted, title: e.target.value })} />
              </Field>
              <Field label="Lesson">
                <Textarea value={extracted.lesson} onChange={(e) => setExtracted({ ...extracted, lesson: e.target.value })} />
              </Field>
              <Field label="Principle candidate">
                <Textarea
                  value={extracted.principle}
                  onChange={(e) => setExtracted({ ...extracted, principle: e.target.value })}
                />
              </Field>
              <p className="text-xs text-muted-foreground">Gap: {extracted.evidenceGap || "None stated"}</p>
              <div className="flex gap-2">
                <Button onClick={save}>Keep as candidate</Button>
                <Button variant="outline" onClick={() => setExtracted(null)}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {experiences.length === 0 ? (
        <EmptyState title="Nothing captured yet" detail="Capture a live or practice moment to begin lineage." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {experiences.map((exp) => {
            const prin = principles.find((p) => p.id === exp.principleId);
            return (
              <article key={exp.id} className="engine-card flex flex-col p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <StatusBadge status={exp.validationStatus} />
                  <span className="font-mono text-[0.625rem] text-muted-foreground">{fmtDate(exp.createdAt)}</span>
                </div>
                <h3 className="text-sm font-semibold">{exp.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{exp.situation}</p>
                <div className="mt-3 border border-primary/20 bg-accent p-3">
                  <div className="engine-kicker text-primary">Lesson</div>
                  <p className="mt-1 text-sm">{exp.lesson}</p>
                </div>
                {prin ? (
                  <p className="mt-3 text-xs text-muted-foreground">Feeds principle: {prin.statement}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
