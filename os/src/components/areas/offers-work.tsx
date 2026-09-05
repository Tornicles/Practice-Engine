import { useState } from "react";
import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Kpi, Panel, Select, StatusBadge } from "@/components/engine";
import { commercialHealth, stats } from "@/lib/compute";
import { useEngine } from "@/lib/store";
import type { Opportunity } from "@/lib/types";

const stages: Opportunity["stage"][] = ["lead", "qualified", "conversation", "proposed", "won", "lost"];

export function OffersWork() {
  const state = useEngine();
  const s = stats(state);
  const health = commercialHealth(state);
  const [prospect, setProspect] = useState("");
  const lost = state.opportunities.filter((o) => o.stage === "lost");
  const reasons = lost.reduce<Record<string, number>>((acc, o) => {
    const key = o.reason ?? "unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {health.sellingUnvalidated ? (
        <div className="mb-4 border border-warn/40 bg-accent p-4 text-sm">
          {health.warning}{" "}
          <DashLink to="/development" tab="methodology" className="text-primary">
            Open methodology
          </DashLink>
        </div>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Pipeline" value={s.pipeline} hint={`$${s.pipelineValue.toLocaleString()} open`} />
        <Kpi label="Conversion" value={`${s.conversion}%`} hint="Won / closed" />
        <Kpi label="Lost value" value={`$${s.lostValue.toLocaleString()}`} />
        <Kpi label="Methodology" value={health.methodologyStatus} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {state.offers.map((offer) => {
          const fw = state.frameworks.find((f) => f.id === offer.frameworkId);
          return (
            <Panel key={offer.id} title={offer.name} action={<StatusBadge status={offer.status} />}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>
                    {offer.type} · {offer.duration}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd>{offer.price}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <div className="engine-kicker">Problem</div>
                <p className="text-sm">{offer.problem}</p>
              </div>
              <div className="mt-3">
                <div className="engine-kicker">Promise</div>
                <p className="text-sm">{offer.promise}</p>
              </div>
              <div className="mt-3">
                <div className="engine-kicker">Methodology</div>
                <p className="text-sm">
                  {offer.methodology}
                  {fw ? ` · ${fw.validationStatus}` : ""}
                </p>
              </div>
              <div className="engine-kicker mt-3 mb-1">Components</div>
              <ul className="list-disc pl-4 text-sm">
                {offer.components.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => state.setOfferStatus(offer.id, "testing")}>
                  Keep testing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    state.setOfferStatus(offer.id, "validated");
                    const next = useEngine.getState().offers.find((o) => o.id === offer.id);
                    if (next?.status === "needs_revision") {
                      toast.error("Cannot validate an offer whose methodology is still in testing.");
                    } else {
                      toast.success("Offer marked validated.");
                    }
                  }}
                >
                  Mark validated
                </Button>
              </div>
            </Panel>
          );
        })}
        <Panel title="Create from methodology">
          <p className="mb-3 text-sm text-muted-foreground">
            Offers inherit the framework. If the framework is not supported, the offer is born as an idea.
          </p>
          {state.frameworks.map((fw) => (
            <Button
              key={fw.id}
              variant="outline"
              className="mb-2 w-full"
              onClick={() => {
                state.addOfferFromFramework(fw.id);
                toast.message(
                  ["supported", "validated"].includes(fw.validationStatus)
                    ? "Offer created in testing."
                    : "Offer created as an idea — methodology is not validated.",
                );
              }}
            >
              New offer from {fw.name}
            </Button>
          ))}
        </Panel>
        <Panel title="Lost opportunity analysis">
          <p className="mb-3 text-sm text-muted-foreground">Pattern, not a new landing page.</p>
          {Object.entries(reasons).map(([reason, n]) => (
            <div key={reason} className="mb-2 flex justify-between border border-border p-3 text-sm">
              <span>{reason}</span>
              <span className="font-mono">{n}</span>
            </div>
          ))}
          {lost.map((o) => (
            <div key={o.id} className="mb-2 text-xs text-muted-foreground">
              {o.prospect} — {o.reason}
            </div>
          ))}
          <DashLink to="/development" tab="improve" className="mt-2 inline-block text-sm text-primary">
            Open investigation
          </DashLink>
        </Panel>
      </div>
      <Panel title="Sales pipeline" className="mt-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Field label="New prospect">
            <Input value={prospect} onChange={(e) => setProspect(e.target.value)} placeholder="Name, company" />
          </Field>
          <Button
            className="sm:mt-6"
            variant="outline"
            onClick={() => {
              if (!prospect.trim() || !state.offers[0]) return;
              state.addOpportunity(prospect.trim(), state.offers[0].id);
              setProspect("");
            }}
          >
            Add lead
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="engine-kicker">
              <tr>
                <th className="pb-2">Prospect</th>
                <th className="pb-2">Stage</th>
                <th className="pb-2">Value</th>
                <th className="pb-2">Move</th>
              </tr>
            </thead>
            <tbody>
              {state.opportunities.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2">{o.prospect}</td>
                  <td className="py-2">
                    <StatusBadge status={o.stage} />
                  </td>
                  <td className="py-2 font-mono tabular-nums">${o.value.toLocaleString()}</td>
                  <td className="py-2">
                    <Select
                      className="h-9 w-auto min-w-32"
                      value={o.stage}
                      onChange={(e) => {
                        const stage = e.target.value as Opportunity["stage"];
                        state.moveOpportunity(o.id, stage, stage === "lost" ? o.reason ?? "unspecified" : undefined);
                        if (stage === "won") {
                          const client = useEngine.getState().clients.find((c) => c.relatedOpportunityId === o.id);
                          toast.success(
                            client
                              ? `${client.name} is now a client in status new. Intake is still required.`
                              : "Sale recorded.",
                          );
                          return;
                        }
                        toast.message("Pipeline updated.");
                      }}
                    >
                      {stages.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
