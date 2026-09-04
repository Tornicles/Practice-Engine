import { useState } from "react";
import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Panel, StatusBadge } from "@/components/engine";
import { useEngine } from "@/lib/store";

export function CoursesWork() {
  const state = useEngine();
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");

  return (
    <div className="space-y-4">
      {state.products.map((product) => {
        const fw = state.frameworks.find((f) => f.id === product.frameworkId);
        const blocked = fw && !["supported", "validated"].includes(fw.validationStatus);
        return (
          <div key={product.id} className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <Panel title={product.name} action={<StatusBadge status={product.status} />}>
              <p className="text-sm">{product.outcome}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Inherits: {product.methodology}
                {fw ? ` · ${fw.validationStatus}` : ""}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Backward design: desired outcome → required capability → skills → lessons → practice → assessment.
              </p>
              {blocked ? (
                <p className="mt-3 text-xs text-warn">
                  Source framework is still {fw?.validationStatus}. This product stays a draft until methodology is
                  supported.
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    state.setProductStatus(product.id, "pilot");
                    toast.message("Pilot means learners exist. It is not validation.");
                  }}
                >
                  Move to pilot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const before = product.status;
                    state.setProductStatus(product.id, "validated");
                    const after = useEngine.getState().products.find((p) => p.id === product.id)?.status;
                    if (after === before && blocked) {
                      toast.error("Cannot validate a product whose methodology is still in testing.");
                    } else {
                      toast.success("Product marked validated.");
                    }
                  }}
                >
                  Mark validated
                </Button>
              </div>
            </Panel>
            <Panel title="Curriculum">
              <ol className="space-y-3">
                {product.modules.map((m, i) => (
                  <li key={`${m.title}-${i}`} className="border border-border p-3">
                    <div className="engine-kicker">Module {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-1 text-sm font-semibold">{m.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{m.objective}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Field label="Module title">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field label="Objective">
                  <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
                </Field>
              </div>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!title || !objective) return;
                  state.addProductModule(product.id, title, objective);
                  setTitle("");
                  setObjective("");
                }}
              >
                Add module
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                If{" "}
                <DashLink to="/development" tab="methodology" className="text-primary">
                  the framework
                </DashLink>{" "}
                versions, this product must version with it.
              </p>
            </Panel>
          </div>
        );
      })}
    </div>
  );
}
