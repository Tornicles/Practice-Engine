import { useGetPracticeOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, BookOpen, Target, Network, Zap } from "lucide-react";
import { NextActionWidget } from "@/components/NextActionWidget";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: overview, isLoading } = useGetPracticeOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Practice Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {overview?.profile.name || "Coach"}.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Mastery Score</div>
          <div className="text-4xl font-mono text-primary font-bold">{overview?.profile.practiceScore || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-secondary/20 border-border/50">
              <CardContent className="p-6">
                <Activity className="h-5 w-5 text-muted-foreground mb-4" />
                <div className="text-2xl font-bold">{overview?.practiceSessionCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Practice Sessions</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-border/50">
              <CardContent className="p-6">
                <BookOpen className="h-5 w-5 text-muted-foreground mb-4" />
                <div className="text-2xl font-bold">{overview?.experienceCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Experiences Vaulted</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-border/50">
              <CardContent className="p-6">
                <Network className="h-5 w-5 text-muted-foreground mb-4" />
                <div className="text-2xl font-bold">{overview?.frameworkCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Frameworks Built</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-border/50">
              <CardContent className="p-6">
                <Zap className="h-5 w-5 text-muted-foreground mb-4" />
                <div className="text-2xl font-bold">{overview?.ipAssetCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Total IP Assets</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {overview?.recentActivity && overview.recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {overview.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-4 items-start relative before:absolute before:left-2 before:top-8 before:bottom-[-24px] last:before:hidden before:w-px before:bg-border">
                      <div className="h-4 w-4 rounded-full bg-primary/20 border border-primary z-10 shrink-0 mt-1" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{activity.title}</h4>
                          <Badge variant="outline" className="text-[10px] scale-90 origin-left">{activity.kind}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.detail}</p>
                        <span className="text-xs text-muted-foreground mt-2 block opacity-60">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No recent activity recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <NextActionWidget />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" /> Skill Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {overview?.skills?.map(skill => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-end mb-2 text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="font-mono text-primary">{skill.score}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!overview?.skills || overview.skills.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete practice sessions to unlock skill tracking.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}