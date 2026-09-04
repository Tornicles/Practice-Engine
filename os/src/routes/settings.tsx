import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, PageHeader, Panel, Select, TabBar } from "@/components/engine";
import { SETTINGS_TABS, parseTabSearch } from "@/lib/nav";
import { useEngine } from "@/lib/store";
import type { AppSettings } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  validateSearch: parseTabSearch,
  component: Settings,
});

function Settings() {
  const tab = Route.useSearch({ select: (s) => s.tab }) ?? "profile";
  const navigate = useNavigate({ from: "/settings" });
  const coach = useEngine((s) => s.coach);
  const settings = useEngine((s) => s.settings);
  const updateCoach = useEngine((s) => s.updateCoach);
  const updateSettings = useEngine((s) => s.updateSettings);
  const resetDemo = useEngine((s) => s.resetDemo);
  const [name, setName] = useState(coach.name);
  const [niche, setNiche] = useState(coach.niche);
  const [audience, setAudience] = useState(coach.audience);
  const [experience, setExperience] = useState(coach.experienceLevel);
  const [philosophy, setPhilosophy] = useState(coach.philosophy);
  const [goal, setGoal] = useState(coach.goal);
  const [focus, setFocus] = useState(coach.developmentFocus);

  return (
    <div>
      <PageHeader
        kicker="Configuration"
        title="Settings"
        detail="Who you are, how you want to develop, and how the product should assist — not another operating dashboard."
      />
      <TabBar tabs={[...SETTINGS_TABS]} value={tab} onChange={(id) => void navigate({ search: { tab: id } })} />

      {tab === "profile" ? (
        <Panel title="Profile">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Coaching niche">
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} />
            </Field>
            <Field label="Audience">
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
            </Field>
            <Field label="Experience">
              <Input value={experience} onChange={(e) => setExperience(e.target.value)} />
            </Field>
            <Field label="Bio / philosophy">
              <Textarea value={philosophy} onChange={(e) => setPhilosophy(e.target.value)} />
            </Field>
            <Field label="Goals">
              <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} />
            </Field>
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              updateCoach({ name, niche, audience, experienceLevel: experience, philosophy, goal });
              toast.success("Profile saved. Home and recommendations will use this.");
            }}
          >
            Save profile
          </Button>
        </Panel>
      ) : null}

      {tab === "development" ? (
        <Panel title="Development settings">
          <Field label="Development priority">
            <Input value={focus} onChange={(e) => setFocus(e.target.value)} />
          </Field>
          <p className="mt-3 text-sm text-muted-foreground">
            Skills and objectives are computed from practice and sessions. This field tells Home what to protect today.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              updateCoach({ developmentFocus: focus });
              toast.success("Development priority updated.");
            }}
          >
            Save
          </Button>
        </Panel>
      ) : null}

      {tab === "ai" ? (
        <Panel title="AI settings">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Assistance level">
              <Select
                value={settings.assistanceLevel}
                onChange={(e) =>
                  updateSettings({ assistanceLevel: e.target.value as AppSettings["assistanceLevel"] })
                }
              >
                <option value="low">Low — suggest only</option>
                <option value="medium">Medium — draft on request</option>
                <option value="high">High — draft first</option>
              </Select>
            </Field>
            <Field label="Generation style">
              <Select
                value={settings.generationStyle}
                onChange={(e) =>
                  updateSettings({ generationStyle: e.target.value as AppSettings["generationStyle"] })
                }
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="bold">Bold</option>
              </Select>
            </Field>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The product may draft. It may not invent clients, credentials, or authority.
          </p>
        </Panel>
      ) : null}

      {tab === "notifications" ? (
        <Panel title="Notifications">
          <div className="space-y-3">
            {(Object.keys(settings.notifications) as (keyof AppSettings["notifications"])[]).map((key) => (
              <label key={key} className="flex items-center justify-between border border-border px-3 py-3 text-sm">
                <span className="capitalize">{key}</span>
                <input
                  type="checkbox"
                  checked={settings.notifications[key]}
                  onChange={(e) =>
                    updateSettings({
                      notifications: { ...settings.notifications, [key]: e.target.checked },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === "privacy" ? (
        <Panel title="Privacy">
          <label className="mb-3 flex items-center justify-between border border-border px-3 py-3 text-sm">
            <span>Client data visible in public assets</span>
            <input
              type="checkbox"
              checked={settings.privacy.clientDataVisible}
              onChange={(e) =>
                updateSettings({
                  privacy: { ...settings.privacy, clientDataVisible: e.target.checked },
                })
              }
            />
          </label>
          <label className="flex items-center justify-between border border-border px-3 py-3 text-sm">
            <span>Allow AI to read practice and session notes</span>
            <input
              type="checkbox"
              checked={settings.privacy.aiPermissions}
              onChange={(e) =>
                updateSettings({
                  privacy: { ...settings.privacy, aiPermissions: e.target.checked },
                })
              }
            />
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            Client names never become marketing copy unless you attach a verified proof with permission.
          </p>
        </Panel>
      ) : null}

      {tab === "account" ? (
        <Panel title="Account">
          <p className="text-sm">Subscription: Practice Engine working preview.</p>
          <p className="mt-2 text-sm text-muted-foreground">Security is handled by the host. This workspace stores operating data on this device.</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              resetDemo();
              toast.message("Demo data reset.");
            }}
          >
            Reset demo data
          </Button>
        </Panel>
      ) : null}
    </div>
  );
}
