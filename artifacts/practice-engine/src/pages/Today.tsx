import { useGetPracticeOverview } from "@workspace/api-client-react";
import { Link } from "wouter";
import { NextActionWidget } from "@/components/NextActionWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, ChevronRight, Activity, BookOpen, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Today() {
  const { data: overview, isLoading } = useGetPracticeOverview();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-500" data-testid="state-today-loading">
        <Skeleton className="h-28 w-full" />
        <div className="grid md:grid-cols-2 gap-8"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      </div>
    );
  }

  const profile = overview?.profile;
  const onboardingData = profile?.onboardingData;
  const practiceFocus = onboardingData?.goals?.primaryGoal || profile?.goal || "Improve your coaching technique";
  const buildAmbition = onboardingData?.build?.firstBuild?.title || "your methodology";

  return (
    <div className="mx-auto max-w-5xl space-y-7 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <div className="engine-kicker mb-3">WORKSPACE / DAILY SEQUENCE</div>
          <h1 className="engine-section-title">Today</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> {today}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Focus</h2>
            <NextActionWidget />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Daily Execution Sequence</h2>
            <div className="space-y-3">
              <Link href="/practice" className="block">
                <Card className="engine-card cursor-pointer transition-colors group hover:border-primary/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">1. Practice</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">Focus: {practiceFocus}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/delivery" className="block">
                <Card className="engine-card cursor-pointer transition-colors group hover:border-primary/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">2. Reflect</div>
                        <div className="text-xs text-muted-foreground">Process a real coaching experience</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/methodology" className="block">
                <Card className="engine-card cursor-pointer transition-colors group hover:border-primary/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">3. Build</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">Develop {buildAmbition}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="engine-card border-border bg-card">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="text-base">Daily Reflection</CardTitle>
              <CardDescription>What is the most important coaching realization you had today?</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-center py-12 flex flex-col items-center">
              <p className="text-muted-foreground text-sm italic mb-4">"The quality of your coaching is bounded by the quality of your reflection."</p>
              <div className="h-24 w-px bg-gradient-to-b from-primary/30 to-transparent mx-auto"></div>
              <Link href="/delivery" className="mt-4 inline-flex h-9 items-center justify-center gap-2 border border-primary/30 bg-primary/5 px-4 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors">
                Log an experience
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}