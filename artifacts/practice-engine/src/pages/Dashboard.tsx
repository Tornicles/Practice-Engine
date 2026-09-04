import { useGetPracticeOverview } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Activity, ArrowRight, BookOpen, Network, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NextActionWidget } from "@/components/NextActionWidget";

export default function Dashboard() {
  const { data: overview, isLoading, isError, refetch } = useGetPracticeOverview();

  if (isLoading) {
    return (
      <div className="space-y-5" data-testid="state-dashboard-loading">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="engine-card border-destructive/50 p-8 text-center" data-testid="state-dashboard-error">
        <div className="engine-kicker mb-3 text-destructive">WORKSPACE OFFLINE</div>
        <h1 className="text-xl font-semibold">Could not load your practice overview.</h1>
        <p className="mt-2 text-sm text-muted-foreground">The workspace is still intact. Try reconnecting to see the latest signal.</p>
        <button onClick={() => refetch()} className="mt-5 border border-border px-3 py-2 text-xs uppercase tracking-wider hover:border-primary hover:text-primary" data-testid="button-retry-dashboard">Retry connection</button>
      </div>
    );
  }

  const profile = overview?.profile;
  const activity = overview?.recentActivity ?? [];
  const onboardingData = profile?.onboardingData;
  const focusGoal = onboardingData?.goals?.primaryGoal || profile?.goal || profile?.developmentFocus || "Improve your coaching technique.";
  const firstBuildTitle = onboardingData?.build?.firstBuild?.title;
  const firstBuildType = onboardingData?.build?.firstBuild?.type;
  const focusDetail = firstBuildTitle ? `Your first ambition: Build a ${firstBuildType || "framework"} about "${firstBuildTitle}".` : "One focused practice can improve the skill you use with real clients today.";
  const planSummary = onboardingData?.thirtyDayPlan?.customization || "Complete daily practice to build your expertise.";

  const stats = [
    { label: "Practice sessions", value: overview?.practiceSessionCount ?? 0, icon: Activity },
    { label: "Experiences captured", value: overview?.experienceCount ?? 0, icon: BookOpen },
    { label: "Frameworks built", value: overview?.frameworkCount ?? 0, icon: Network },
    { label: "IP assets", value: overview?.ipAssetCount ?? 0, icon: Zap },
  ];

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="engine-kicker mb-3">PRACTICE OS / OVERVIEW</div>
          <h1 className="engine-section-title">Good morning, {profile?.name || "Coach"}.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your practice is becoming your expertise.</p>
        </div>
        <Link href="/today" className="inline-flex items-center gap-2 text-xs uppercase tracking-[.1em] text-primary hover:underline" data-testid="link-dashboard-today">
          View today’s sequence <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <section className="engine-card border-primary/30 bg-primary/[.045] p-5 md:p-6" data-testid="card-dashboard-focus">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="engine-kicker mb-2 text-primary">TODAY’S FOCUS</div>
            <h2 className="text-lg font-semibold">{focusGoal}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{focusDetail}</p>
            {onboardingData?.thirtyDayPlan?.customization && (
              <p className="mt-2 max-w-2xl text-xs text-muted-foreground/80 border-l-2 border-primary/30 pl-3 italic">{planSummary}</p>
            )}
          </div>
          <Link href="/practice" className="inline-flex h-9 shrink-0 items-center justify-center border border-primary bg-primary px-4 text-xs font-semibold uppercase tracking-[.08em] text-primary-foreground hover:bg-primary/90" data-testid="link-dashboard-start-practice">Start practice</Link>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/today" className="engine-card block p-4 hover:border-primary/50 transition-colors" data-testid="link-nav-today">
          <div className="engine-kicker mb-1">Execution</div>
          <div className="font-semibold text-sm">Today</div>
        </Link>
        <Link href="/practice" className="engine-card block p-4 hover:border-primary/50 transition-colors" data-testid="link-nav-practice">
          <div className="engine-kicker mb-1">Development</div>
          <div className="font-semibold text-sm">Practice Simulator</div>
        </Link>
        <Link href="/knowledge" className="engine-card block p-4 hover:border-primary/50 transition-colors" data-testid="link-nav-vault">
          <div className="engine-kicker mb-1">Expertise</div>
          <div className="font-semibold text-sm">Experience Vault</div>
        </Link>
        <Link href="/passport" className="engine-card block p-4 hover:border-primary/50 transition-colors" data-testid="link-nav-passport">
          <div className="engine-kicker mb-1">Identity</div>
          <div className="font-semibold text-sm">Coach Passport</div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }, index) => (
          <Card key={label} className="engine-card" data-testid={`card-dashboard-stat-${index}`}>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between"><span className="engine-kicker">{label}</span><Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} /></div>
              <div className="font-mono text-2xl text-foreground">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="engine-card">
          <CardHeader className="border-b border-border pb-4"><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="pt-5">
            {activity.length ? (
              <div className="space-y-0">
                {activity.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-3 border-b border-border/70 pb-4 pt-1 last:border-0 last:pb-0" data-testid={`row-activity-${entry.id}`}>
                    <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{index < activity.length - 1 && <span className="absolute top-3 h-12 w-px bg-border" />}</div>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium">{entry.title}</h3><span className="engine-kicker border border-border px-1.5 py-0.5">{entry.kind}</span></div><p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p><p className="mt-2 font-mono text-[10px] text-muted-foreground/70">{new Date(entry.createdAt).toLocaleString()}</p></div>
                  </div>
                ))}
              </div>
            ) : <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground" data-testid="state-dashboard-empty">No activity recorded yet. Start a practice session to create your first signal.</div>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <NextActionWidget />
          <Card className="engine-card">
            <CardHeader className="border-b border-border pb-4"><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" /> Skill progress</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-5">
              {overview?.skills?.length ? overview.skills.map((skill) => (
                <div key={skill.name} data-testid={`row-skill-${skill.name.toLowerCase().replaceAll(" ", "-")}`}>
                  <div className="mb-2 flex justify-between text-xs"><span>{skill.name}</span><span className="font-mono text-primary">{skill.score}%</span></div>
                  <div className="engine-progress"><div style={{ width: `${skill.score}%` }} /></div>
                </div>
              )) : <p className="text-sm text-muted-foreground">Complete a session to unlock skill tracking.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="engine-card">
        <CardHeader className="border-b border-border pb-4"><CardTitle className="text-base">Experience <span className="px-1 text-primary">→</span> Expertise <span className="px-1 text-primary">→</span> IP</CardTitle></CardHeader>
        <CardContent className="grid gap-0 pt-0 md:grid-cols-3">
          {[
            ["01", "Lived experience", overview?.experienceCount ?? 0, "Capture what happened in the room."],
            ["02", "Structural knowledge", (overview?.lessonCount ?? 0) + (overview?.principleCount ?? 0), "Name the lesson and the principle."],
            ["03", "Reusable IP", overview?.ipAssetCount ?? 0, "Prove it, teach it, package it."],
          ].map(([step, label, value, detail]) => (
            <div key={step} className="border-b border-border p-5 first:pl-0 last:border-0 md:border-b-0 md:border-r md:last:border-0" data-testid={`card-chain-${step}`}>
              <div className="engine-kicker mb-4 text-primary">{step}</div><div className="flex items-end gap-3"><span className="font-mono text-2xl">{value}</span><span className="mb-1 text-sm font-medium">{label}</span></div><p className="mt-2 text-xs text-muted-foreground">{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}