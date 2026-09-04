import { useState } from "react";
import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Field, LineageList, Panel, StatusBadge, TabBar } from "@/components/engine";
import { useEngine } from "@/lib/store";
import type { ReuseDest, ValidationStatus } from "@/lib/types";

const reuseOptions: ReuseDest[] = ["coaching", "content", "course", "offer"];

export function MethodologyWork() {
  const state = useEngine();
  const [tab, setTab] = useState("hierarchy");
  const [hyp, setHyp] = useState("");
  const [app, setApp] = useState("");
  const [result, setResult] = useState("");
  const [conclusion, setConclusion] = useState("");
  const fw = state.frameworks[0];
  const method = state.methods[0];
  const protocol = state.protocols[0];
  const drill = state.drills[0];

  return (
    <div>
      <TabBar
        tabs={[
          { id: "hierarchy", label: "Hierarchy" },
          { id: "principles", label: "Principles" },
          { id: "ip", label: "Reuse" },
          { id: "tests", label: "Tests" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "hierarchy" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="How the work is structured">
            <LineageList
              items={[
                { label: "Philosophy", meta: state.coach.philosophy },
                { label: `Principle — ${state.principles[0]?.statement ?? ""}`, meta: state.principles[0]?.validationStatus },
                { label: `Method — ${method?.name ?? ""}`, meta: method?.validationStatus },
                { label: `Framework — ${fw?.name ?? ""}`, meta: fw ? `v${fw.version} · ${fw.validationStatus}` : "" },
                { label: `Protocol — ${protocol?.name ?? ""}`, meta: protocol?.steps.join(" → ") },
                { label: `Exercise — ${drill?.name ?? ""}`, href: "/development", meta: `${drill?.minutes ?? 0} min drill` },
              ]}
            />
          </Panel>
          <Panel title={fw?.name ?? "Framework"} action={fw ? <StatusBadge status={fw.validationStatus} /> : null}>
            {fw ? (
              <>
                <p className="font-mono text-xs text-primary">{fw.sequence}</p>
                <p className="mt-2 text-sm text-muted-foreground">{fw.problem}</p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm">
                  {fw.components.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">{fw.changeNote}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["testing", "supported", "needs_revision"] as ValidationStatus[]).map((st) => (
                    <Button key={st} size="sm" variant="outline" onClick={() => state.setFrameworkStatus(fw.id, st)}>
                      Mark {st.replaceAll("_", " ")}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      state.versionFramework(fw.id, `v${fw.version + 1} after additional test evidence.`);
                      toast.message("Versioned. History is kept. Status returns to testing.");
                    }}
                  >
                    Version
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Method: {method?.name}. When not to use: {method?.whenNotToUse}
                </p>
              </>
            ) : null}
          </Panel>
        </div>
      ) : null}

      {tab === "principles" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.principles.map((p) => {
            const supporting = state.experiences.filter((e) => p.experienceIds.includes(e.id));
            const contradicting = state.experiences.filter((e) => p.contradictingIds.includes(e.id));
            return (
              <Panel key={p.id} title={p.statement} action={<StatusBadge status={p.validationStatus} />}>
                <p className="text-sm text-muted-foreground">{p.explanation}</p>
                <p className="mt-2 font-mono text-[0.625rem] text-muted-foreground">
                  confidence {Math.round(p.confidence * 100)} · {p.context}
                </p>
                <div className="mt-3">
                  <div className="engine-kicker mb-1">Supporting</div>
                  {supporting.map((e) => (
                    <p key={e.id} className="text-xs">
                      {e.title} — {e.lesson}
                    </p>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="engine-kicker mb-1">Contradicting / limits</div>
                  {contradicting.length ? (
                    contradicting.map((e) => (
                      <p key={e.id} className="text-xs text-warn">
                        {e.title} — {e.lesson}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No contradiction attached.</p>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => state.setPrincipleStatus(p.id, "testing")}>
                    Testing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      state.setPrincipleStatus(p.id, "supported");
                      toast.success("You changed status. The model did not.");
                    }}
                  >
                    Support
                  </Button>
                  {state.experiences[0] ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        state.attachContradiction(p.id, state.experiences[0].id);
                        toast.message("Limitation recorded. Principle needs revision, not slogans.");
                      }}
                    >
                      Attach limitation
                    </Button>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : null}

      {tab === "ip" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.ipAssets.map((asset) => (
            <Panel key={asset.id} title={asset.title} action={<StatusBadge status={asset.status} />}>
              <p className="text-sm text-muted-foreground">{asset.description}</p>
              <p className="mt-2 font-mono text-[0.625rem] text-muted-foreground">
                {asset.type} · v{asset.version}
              </p>
              <div className="engine-kicker mt-3 mb-1">Lineage</div>
              <p className="text-xs text-muted-foreground">{asset.sourceLineage.join(" → ")}</p>
              <div className="engine-kicker mt-3 mb-1">Reusable in</div>
              <div className="flex flex-wrap gap-2">
                {asset.reuse.map((r) => (
                  <StatusBadge key={r} status={r} />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {reuseOptions.map((dest) => (
                  <Button
                    key={dest}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      state.reuseIP(asset.id, dest);
                      toast.message(
                        dest === "offer" && asset.status !== "validated"
                          ? "Offer drafted as an idea. Methodology is not validated."
                          : `Sent to ${dest} with lineage preserved.`,
                      );
                    }}
                  >
                    Reuse in {dest}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Validated work can feed{" "}
                <DashLink to="/content" tab="brand" className="text-primary">
                  brand
                </DashLink>
                ,{" "}
                <DashLink to="/content" tab="create" className="text-primary">
                  content
                </DashLink>
                ,{" "}
                <DashLink to="/content" tab="offers" className="text-primary">
                  offers
                </DashLink>
                , and{" "}
                <DashLink to="/content" tab="courses" className="text-primary">
                  courses
                </DashLink>
                . Testing work should not be sold as established expertise.
              </p>
            </Panel>
          ))}
        </div>
      ) : null}

      {tab === "tests" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Record a methodology test">
            <p className="mb-3 text-sm text-muted-foreground">
              Apply the method, observe, compare expected vs actual. A draft is not a result.
            </p>
            <div className="space-y-3">
              <Field label="Hypothesis">
                <Textarea value={hyp} onChange={(e) => setHyp(e.target.value)} />
              </Field>
              <Field label="What you applied">
                <Textarea value={app} onChange={(e) => setApp(e.target.value)} />
              </Field>
              <Field label="Result">
                <Textarea value={result} onChange={(e) => setResult(e.target.value)} />
              </Field>
              <Field label="Conclusion">
                <Textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} />
              </Field>
              <Button
                onClick={() => {
                  if (!fw || !hyp || !result) {
                    toast.error("Hypothesis and result are required.");
                    return;
                  }
                  state.addMethodologyTest({
                    frameworkId: fw.id,
                    context: "Live or practice application",
                    hypothesis: hyp,
                    application: app,
                    result,
                    conclusion,
                    status: "testing",
                  });
                  toast.success("Test stored. Framework remains in testing until you promote it.");
                  setHyp("");
                  setApp("");
                  setResult("");
                  setConclusion("");
                }}
              >
                Save test
              </Button>
            </div>
          </Panel>
          <Panel title="Test log">
            <div className="space-y-3">
              {state.methodologyTests.map((t) => (
                <div key={t.id} className="border border-border p-3">
                  <StatusBadge status={t.status} />
                  <p className="mt-2 text-sm font-medium">{t.hypothesis}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Applied: {t.application}</p>
                  <p className="mt-1 text-xs">Result: {t.result}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.conclusion}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
