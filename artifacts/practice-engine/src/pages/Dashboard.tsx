import { useGetPracticeOverview } from "@workspace/api-client-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "wouter"
import { 
  TrendingUp, 
  Activity, 
  BookOpen, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Target,
  Zap,
  Star
} from "lucide-react"

export default function Dashboard() {
  const { data, isLoading } = useGetPracticeOverview()

  if (isLoading || !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  const { profile, skills, jobs, recentActivity } = data

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">
            Welcome back, {profile.name}
          </h1>
          <p className="text-muted-foreground">
            {profile.niche} • {profile.experienceLevel}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-lg border">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Practice Score</span>
            <span className="text-xl font-bold text-primary flex items-center gap-1">
              <Zap className="h-4 w-4 fill-primary" /> {profile.practiceScore}
            </span>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Streak</span>
            <span className="text-xl font-bold flex items-center gap-1">
              <Activity className="h-4 w-4" /> {profile.streak} Days
            </span>
          </div>
        </div>
      </div>

      {/* Primary Actions / Flywheel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/today" className="group block">
          <Card className="h-full border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
            <CardHeader className="pb-2">
              <Target className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Today's Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your sequenced actions for today's development.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/practice" className="group block">
          <Card className="h-full hover:border-foreground/30 transition-colors">
            <CardHeader className="pb-2">
              <Zap className="h-6 w-6 mb-2" />
              <CardTitle className="text-lg">Simulator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Practice complex scenarios before real clients.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/knowledge" className="group block">
          <Card className="h-full hover:border-foreground/30 transition-colors">
            <CardHeader className="pb-2">
              <BookOpen className="h-6 w-6 mb-2" />
              <CardTitle className="text-lg">Capture Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Extract lessons from recent client sessions.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/methodology" className="group block">
          <Card className="h-full hover:border-foreground/30 transition-colors">
            <CardHeader className="pb-2">
              <Layers className="h-6 w-6 mb-2" />
              <CardTitle className="text-lg">Methodology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Synthesize experiences into your IP.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Focus & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Jobs (To-Do) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">Development Focus</h2>
            <Badge variant="premium">{profile.developmentFocus || "Setup Focus"}</Badge>
          </div>
          
          <div className="space-y-3">
            {jobs.map(job => (
              <Card key={job.id} className="p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{job.kind}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" /> {job.duration}
                      </span>
                    </div>
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {jobs.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground">No active jobs. Set a development focus in your passport.</p>
                <Button variant="outline" className="mt-4" asChild><Link href="/passport">Go to Passport</Link></Button>
              </Card>
            )}
          </div>
        </div>

        {/* Skills & Stats Radar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skill Radar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map(skill => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{skill.name}</span>
                    <span className="font-medium">{skill.score}/100</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                        {new Date(activity.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground">View Timeline</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
