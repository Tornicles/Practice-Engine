import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarFigure } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Field, PageHeader, Panel, Select, TabBar } from "@/components/engine";
import { downloadExport } from "@/lib/export";
import { SETTINGS_TABS, parseTabSearch } from "@/lib/nav";
import { useForge } from "@/lib/store";
import {
  AVATAR_STYLE_LABELS,
  EQUIPMENT_LABELS,
  FITNESS_LEVEL_LABELS,
  GOAL_LABELS,
  MEDICAL_DISCLAIMER,
  PERSONA_LABELS,
  SEX_LABELS,
  WORK_TYPE_LABELS,
} from "@/lib/types";
import type { AvatarStyle, EquipmentKey, FitnessGoal, FitnessLevel, Sex, WorkType } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  validateSearch: parseTabSearch,
  component: Settings,
});

function Settings() {
  const [tab, setTab] = useState("profile");
  return (
    <div>
      <PageHeader
        kicker="Settings"
        title="Your Forge"
        detail="Profile, work, equipment, and your data. Forge tunes everything around these."
      />
      <TabBar tabs={[...SETTINGS_TABS]} value={tab} onChange={setTab} />
      {tab === "profile" ? <Profile /> : tab === "work" ? <Work /> : tab === "equipment" ? <Equipment /> : <Data />}
      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
    </div>
  );
}

function Profile() {
  const profile = useForge((s) => s.profile);
  const updateProfile = useForge((s) => s.updateProfile);
  const updateSettings = useForge((s) => s.updateSettings);
  const coachPersona = useForge((s) => s.settings.coachPersona);
  const stage = useForge((s) => s.avatar.stage);

  return (
    <div className="space-y-4">
      <Panel title="About you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input className="engine-select" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
          </Field>
          <Field label="Goal">
            <Select value={profile.goal} onChange={(e) => updateProfile({ goal: e.target.value as FitnessGoal })}>
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => (
                <option key={g} value={g}>{GOAL_LABELS[g]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Goal in your words">
            <input className="engine-select" value={profile.goalDetail} onChange={(e) => updateProfile({ goalDetail: e.target.value })} />
          </Field>
          <Field label="Fitness level">
            <Select value={profile.fitnessLevel} onChange={(e) => updateProfile({ fitnessLevel: e.target.value as FitnessLevel })}>
              {(Object.keys(FITNESS_LEVEL_LABELS) as FitnessLevel[]).map((l) => (
                <option key={l} value={l}>{FITNESS_LEVEL_LABELS[l]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Age">
            <input type="number" className="engine-select" value={profile.age ?? ""} onChange={(e) => updateProfile({ age: e.target.value ? Number(e.target.value) : undefined })} />
          </Field>
          <Field label="Sex">
            <Select value={profile.sex ?? ""} onChange={(e) => updateProfile({ sex: (e.target.value || undefined) as Sex | undefined })}>
              <option value="">Prefer not to say</option>
              {(Object.keys(SEX_LABELS) as Sex[]).map((s) => (
                <option key={s} value={s}>{SEX_LABELS[s]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Height (cm)">
            <input type="number" className="engine-select" value={profile.heightCm ?? ""} onChange={(e) => updateProfile({ heightCm: e.target.value ? Number(e.target.value) : undefined })} />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" step={0.5} className="engine-select" value={profile.weightKg ?? ""} onChange={(e) => updateProfile({ weightKg: e.target.value ? Number(e.target.value) : undefined })} />
          </Field>
        </div>
        <Field label="Injuries or limitations (so Forge works around them)" className="mt-4">
          <input
            className="engine-select"
            value={profile.injuries}
            onChange={(e) => updateProfile({ injuries: e.target.value })}
            placeholder="e.g. sore left knee — keep sessions low impact"
          />
        </Field>
      </Panel>

      <Panel title="Your avatar">
        <div className="flex items-center gap-4">
          <AvatarFigure spec={profile.avatar} stage={stage} size={72} />
          <Field label="Style" className="w-48">
            <Select value={profile.avatar.style} onChange={(e) => updateProfile({ avatar: { ...profile.avatar, style: e.target.value as AvatarStyle } })}>
              {(Object.keys(AVATAR_STYLE_LABELS) as AvatarStyle[]).map((s) => (
                <option key={s} value={s}>{AVATAR_STYLE_LABELS[s]}</option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Your avatar evolves with XP — spark, ember, forge, titan.</p>
      </Panel>

      <Panel title="Coach personality">
        <Field label="Tone">
          <Select value={coachPersona} onChange={(e) => updateSettings({ coachPersona: e.target.value as typeof coachPersona })}>
            {(Object.keys(PERSONA_LABELS) as (keyof typeof PERSONA_LABELS)[]).map((p) => (
              <option key={p} value={p}>{PERSONA_LABELS[p]}</option>
            ))}
          </Select>
        </Field>
      </Panel>
    </div>
  );
}

function Work() {
  const occupation = useForge((s) => s.occupation);
  const updateOccupation = useForge((s) => s.updateOccupation);
  return (
    <Panel title="Work & schedule">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Work type">
          <Select value={occupation.workType} onChange={(e) => updateOccupation({ workType: e.target.value as WorkType })}>
            {(Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((w) => (
              <option key={w} value={w}>{WORK_TYPE_LABELS[w]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Hours per day">
          <input type="number" min={1} max={18} className="engine-select" value={occupation.hoursPerDay} onChange={(e) => updateOccupation({ hoursPerDay: Number(e.target.value) || 8 })} />
        </Field>
        <Field label="What you do">
          <input className="engine-select" value={occupation.label} onChange={(e) => updateOccupation({ label: e.target.value })} />
        </Field>
        <Field label="Preferred training time">
          <Select value={occupation.preferredTrainingTime} onChange={(e) => updateOccupation({ preferredTrainingTime: e.target.value as "morning" | "lunch" | "evening" })}>
            <option value="morning">Morning</option>
            <option value="lunch">Lunch</option>
            <option value="evening">Evening</option>
          </Select>
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={occupation.shiftWork} onChange={(e) => updateOccupation({ shiftWork: e.target.checked })} />
        Shift work (irregular hours)
      </label>
      <p className="mt-3 text-xs text-muted-foreground">
        Forge adapts session length, timing, and intensity around your workday — short sessions for long desk days, recovery after physical shifts.
      </p>
    </Panel>
  );
}

function Equipment() {
  const equipment = useForge((s) => s.equipment);
  const updateEquipment = useForge((s) => s.updateEquipment);
  return (
    <Panel title="Equipment you have at home">
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((k) => (
          <label key={k} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm hover:border-primary/40">
            <input type="checkbox" checked={equipment[k]} onChange={() => updateEquipment({ [k]: !equipment[k] } as Partial<typeof equipment>)} />
            {EQUIPMENT_LABELS[k]}
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Only workouts using this equipment will be suggested.</p>
    </Panel>
  );
}

function Data() {
  const resetDemo = useForge((s) => s.resetDemo);
  return (
    <div className="space-y-4">
      <Panel title="Your data">
        <p className="text-sm text-muted-foreground">
          Everything Forge knows about you — profile, sessions, meals, runs, scans — exports as one JSON file. Your data, your hands.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { downloadExport(); toast.success("Export downloaded."); }}>
            Export all data (JSON)
          </Button>
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (window.confirm("Reset all demo data back to Alex Rivera's starting point?")) {
                resetDemo();
                toast.success("Demo data reset.");
              }
            }}
          >
            Reset demo data
          </Button>
        </div>
      </Panel>
      <Panel title="How Forge decides">
        <p className="text-sm text-muted-foreground">
          Forge suggests; you decide. AI drafts never become active until you confirm them. Templates are always available offline and are labeled clearly.
        </p>
      </Panel>
    </div>
  );
}
