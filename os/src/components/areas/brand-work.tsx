import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Panel, StatusBadge } from "@/components/engine";
import { authorityGaps } from "@/lib/compute";
import { useEngine } from "@/lib/store";

export function BrandWork() {
  const state = useEngine();
  const gaps = authorityGaps(state);
  const fw = state.frameworks[0];
  const proofs = state.proofs;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Positioning">
        <p className="text-sm font-medium">{state.brand.positioning}</p>
        <p className="mt-2 font-mono text-xs text-primary">{state.brand.tagline}</p>
        <dl className="mt-4 space-y-3 text-sm">
          <Row k="Who" v={state.brand.audience} />
          <Row k="Problem" v={state.brand.problem} />
          <Row k="Promise" v={state.brand.promise} />
          <Row k="Difference" v={state.brand.differentiator} />
          <Row k="Methodology" v={fw ? `${fw.name} · ${fw.validationStatus}` : "None"} />
        </dl>
      </Panel>
      <Panel title="Point of view">
        <p className="text-sm">{state.brand.pov}</p>
        <div className="engine-kicker mt-4 mb-1">From principles</div>
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {state.principles.map((p) => (
            <li key={p.id}>
              {p.statement} <span className="text-xs text-muted-foreground">({p.validationStatus})</span>
            </li>
          ))}
        </ul>
        <div className="engine-kicker mt-4 mb-1">Values</div>
        <ul className="list-disc pl-4 text-sm">
          {state.brand.values.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </Panel>
      <Panel title="Brand assets">
        <div className="engine-kicker">Short bio</div>
        <p className="mt-1 text-sm">{state.brand.shortBio}</p>
        <div className="engine-kicker mt-4">Long bio</div>
        <p className="mt-1 text-sm text-muted-foreground">{state.brand.longBio}</p>
      </Panel>
      <Panel title="Messaging pillars">
        <div className="space-y-3">
          {state.pillars.map((p) => {
            const prin = state.principles.find((x) => x.id === p.principleId);
            return (
              <div key={p.id} className="border border-border p-3">
                <div className="text-sm font-semibold">{p.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.problem}</p>
                <p className="mt-2 text-xs">
                  Principle: {prin?.statement} · Proof: {p.proofIds.length} · Content: {p.contentIds.length}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Claim to proof">
        <div className="space-y-3">
          {state.brand.claims.map((c) => (
            <div key={c.claim} className="border border-border p-3">
              <StatusBadge status={c.proofIds.length ? "supported" : "needs_revision"} />
              <p className="mt-2 text-sm">{c.claim}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.proofIds.length
                  ? proofs
                      .filter((p) => c.proofIds.includes(p.id))
                      .map((p) => p.source)
                      .join(" · ")
                  : "Unsupported claim. Do not publish this as authority."}
              </p>
            </div>
          ))}
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            const s = state.sessions[0];
            if (!s) return;
            state.addProof("Documented client decision-rule outcome", `Session ${s.id} · ${s.outcome}`);
            toast.success("Proof attached. Still verify permission before public use.");
          }}
        >
          Attach latest session as proof
        </Button>
      </Panel>
      <Panel title="Proof objects">
        <div className="space-y-3">
          {proofs.map((p) => (
            <div key={p.id} className="border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={p.verificationStatus} />
                {p.verificationStatus !== "verified" ? (
                  <Button size="sm" variant="outline" onClick={() => state.verifyProof(p.id)}>
                    Mark verified
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium">{p.claim}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.type} · {p.source}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="engine-kicker mb-2">Authority gaps</div>
          {gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No computed gaps.</p>
          ) : (
            gaps.map((g) => (
              <DashLink key={g.title} to={g.to} tab={g.tab} className="mb-2 block border border-border p-3 hover:border-primary/40">
                <div className="text-sm font-medium">{g.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{g.why}</p>
              </DashLink>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="engine-kicker">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
