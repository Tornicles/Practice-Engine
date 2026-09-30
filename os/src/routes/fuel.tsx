import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, Field, PageHeader, Panel, Select, SourceNote, StatusBadge, TabBar } from "@/components/engine";
import { extractGroceries, planMeals, templateMealsFromIngredients } from "@/lib/ai";
import { FUEL_TABS, parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import { DIET_LABELS } from "@/lib/types";
import type { DietKind, Ingredient, Meal } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/fuel")({
  validateSearch: parseTabSearch,
  component: Fuel,
});

function Fuel() {
  const [tab, setTab] = useState("today");
  return (
    <div>
      <PageHeader
        kicker="Fuel"
        title="Eat from your groceries"
        detail="Snap your grocery haul — Forge reads the ingredients and builds meals from what's actually there."
      />
      <TabBar tabs={[...FUEL_TABS]} value={tab} onChange={setTab} />
      {tab === "today" ? <TodayMeals /> : tab === "groceries" ? <GroceryScans /> : <Prefs />}
    </div>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <div className="engine-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{meal.name}</h3>
        {meal.calories ? <span className="font-mono text-xs text-muted-foreground">{meal.calories} kcal</span> : null}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{meal.ingredients.join(", ")}</div>
      <div className="mt-2 flex items-center gap-2 font-mono text-[0.625rem] text-muted-foreground">
        <span>{meal.prepMin} min</span>
        {meal.proteinG ? <span>{meal.proteinG}g protein</span> : null}
        {meal.tags.includes("template") ? <StatusBadge status="template" tone="warn" /> : null}
      </div>
    </div>
  );
}

function TodayMeals() {
  const state = useForge();
  const saveMealPlan = useForge((s) => s.saveMealPlan);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const plan = state.mealPlans.find((m) => m.date.slice(0, 10) === today);
  const latestScan = state.groceryScans[0];

  const generateFromScan = async () => {
    if (!latestScan) {
      toast.error("Scan some groceries first.");
      return;
    }
    setBusy(true);
    try {
      const res = await planMeals({
        data: {
          ingredients: latestScan.ingredients.map((i) => i.qty ? `${i.name} (${i.qty})` : i.name),
          diet: state.dietary.diet,
          allergies: state.dietary.allergies,
          calorieTarget: state.dietary.calorieTarget,
        },
      });
      const meals: Meal[] = res.ok
        ? (res as { ok: true; meals: Meal[] }).meals
        : templateMealsFromIngredients(latestScan.ingredients.map((i) => i.name), state.dietary.diet);
      if (!res.ok) toast.error(`AI unavailable (${res.error}). Template meals used — clearly labeled.`);
      saveMealPlan({
        date: new Date().toISOString(),
        meals,
        source: res.ok ? "ai" : "template",
        groceryScanId: latestScan.id,
      });
      toast.success("Today's meals planned.");
    } finally {
      setBusy(false);
    }
  };

  if (!plan) {
    return (
      <EmptyState
        title="No meals planned today"
        detail={latestScan ? `Generate today's menu from your ${fmtDate(latestScan.scannedAt)} grocery scan.` : "Scan your groceries first, then generate meals from what's there."}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SourceNote source={plan.source} />
        <Button size="sm" variant="outline" onClick={generateFromScan} disabled={busy || !latestScan}>
          {busy ? "Planning…" : "Regenerate"}
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {plan.meals.map((m, i) => (
          <MealCard key={i} meal={m} />
        ))}
      </div>
      {(state.dietary.calorieTarget || state.dietary.proteinTargetG) && (
        <p className="font-mono text-[0.625rem] text-muted-foreground">
          Targets: {state.dietary.calorieTarget ? `${state.dietary.calorieTarget} kcal` : "—"}
          {state.dietary.proteinTargetG ? ` · ${state.dietary.proteinTargetG}g protein` : ""}
        </p>
      )}
    </div>
  );
}

function GroceryScans() {
  const state = useForge();
  const addGroceryScan = useForge((s) => s.addGroceryScan);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [busy, setBusy] = useState(false);
  const [visionNote, setVisionNote] = useState<string | null>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setIngredients([]);
      setVisionNote(null);
    };
    reader.readAsDataURL(f);
  };

  const extract = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const res = await extractGroceries({ data: { imageDataUrl: preview } });
      if (!res.ok) {
        setVisionNote(`Vision unavailable (${res.error}). Type ingredients manually below.`);
        return;
      }
      const list = (res as { ok: true; ingredients: { name: string; qty?: string }[] }).ingredients;
      setIngredients(list.map((i) => ({ name: i.name, qty: i.qty })));
      setVisionNote(`Vision read ${list.length} ingredients. Fix anything it missed, then save.`);
    } finally {
      setBusy(false);
    }
  };

  const [manual, setManual] = useState("");
  const addManual = () => {
    const names = manual.split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setIngredients((prev) => [...prev, ...names.map((name) => ({ name }))]);
    setManual("");
  };

  const save = () => {
    if (!ingredients.length) {
      toast.error("Add at least one ingredient.");
      return;
    }
    addGroceryScan({ ingredients, note: "Grocery haul", visionUsed: visionNote?.startsWith("Vision read") ?? false });
    setPreview(null);
    setIngredients([]);
    setVisionNote(null);
    toast.success("Groceries saved. Generate today's meals from the Today tab.");
  };

  return (
    <div className="space-y-4">
      <Panel title="New scan">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {!preview ? (
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Upload grocery photo
          </Button>
        ) : (
          <div className="space-y-3">
            <img src={preview} alt="Grocery haul" className="max-h-64 rounded-md border border-border object-contain" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={extract} disabled={busy}>{busy ? "Reading…" : "Extract ingredients with AI"}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setPreview(null); setIngredients([]); }}>Discard</Button>
            </div>
          </div>
        )}
        {visionNote ? <p className="mt-2 text-xs text-muted-foreground">{visionNote}</p> : null}
        {(preview || ingredients.length > 0) && (
          <div className="mt-4 space-y-3">
            <Field label="Ingredients (edit freely)">
              <div className="flex gap-2">
                <input
                  className="engine-select !h-10 flex-1 !w-auto"
                  placeholder="Add manually: chicken, rice, broccoli…"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }}
                />
                <Button size="sm" variant="outline" onClick={addManual}>Add</Button>
              </div>
            </Field>
            {ingredients.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs">
                    {ing.name}{ing.qty ? ` (${ing.qty})` : ""}
                    <button
                      type="button"
                      aria-label={`Remove ${ing.name}`}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setIngredients((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={save}>Save grocery scan</Button>
          </div>
        )}
      </Panel>

      <div className="space-y-3">
        {state.groceryScans.map((s) => (
          <div key={s.id} className="engine-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{s.note ?? "Grocery scan"}</span>
              <span className="font-mono text-[0.625rem] text-muted-foreground">{fmtDate(s.scannedAt)}</span>
              {s.visionUsed ? <StatusBadge status="vision" tone="gold" /> : <StatusBadge status="manual" tone="muted" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.ingredients.map((i) => i.name).join(", ")}</p>
          </div>
        ))}
        {state.groceryScans.length === 0 ? (
          <EmptyState title="No scans yet" detail="Your grocery photos and ingredient lists will live here." />
        ) : null}
      </div>
    </div>
  );
}

function Prefs() {
  const dietary = useForge((s) => s.dietary);
  const updateDietary = useForge((s) => s.updateDietary);
  const [allergies, setAllergies] = useState(dietary.allergies.join(", "));
  const [dislikes, setDislikes] = useState(dietary.dislikes.join(", "));

  return (
    <Panel title="Dietary preferences">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Diet">
          <Select value={dietary.diet} onChange={(e) => updateDietary({ diet: e.target.value as DietKind })}>
            {(Object.keys(DIET_LABELS) as DietKind[]).map((d) => (
              <option key={d} value={d}>{DIET_LABELS[d]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Daily calorie target">
          <input
            type="number"
            className="engine-select"
            value={dietary.calorieTarget ?? ""}
            placeholder="e.g. 2200"
            onChange={(e) => updateDietary({ calorieTarget: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
        <Field label="Protein target (g)">
          <input
            type="number"
            className="engine-select"
            value={dietary.proteinTargetG ?? ""}
            placeholder="e.g. 140"
            onChange={(e) => updateDietary({ proteinTargetG: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
        <div />
        <Field label="Allergies (comma separated)">
          <input
            className="engine-select"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            onBlur={() => updateDietary({ allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="peanuts, shellfish"
          />
        </Field>
        <Field label="Dislikes (comma separated)">
          <input
            className="engine-select"
            value={dislikes}
            onChange={(e) => setDislikes(e.target.value)}
            onBlur={() => updateDietary({ dislikes: dislikes.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="mushrooms, cilantro"
          />
        </Field>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Allergies are always respected by AI meal generation.</p>
    </Panel>
  );
}
