import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "wouter"
import { CheckCircle2, Play, BookOpen, Target, ArrowRight } from "lucide-react"

export default function Today() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Today's Focus</h1>
          <p className="text-muted-foreground">Sequenced actions to develop your primary goal.</p>
        </div>
        <Badge variant="outline" className="text-sm py-1 font-medium bg-card">Day 4 of Current Sequence</Badge>
      </div>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        
        {/* Step 1 - Completed */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
          <div className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] opacity-70">
            <CardContent className="p-4">
              <Badge variant="secondary" className="mb-2 text-[10px] uppercase">Review</Badge>
              <h3 className="font-medium text-lg mb-1 line-through">Review Past Experience</h3>
              <p className="text-sm text-muted-foreground">You reviewed the scenario: "The Founder who couldn't delegate".</p>
            </CardContent>
          </Card>
        </div>

        {/* Step 2 - Active */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <Target className="h-5 w-5" />
          </div>
          <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] border-primary shadow-sm ring-1 ring-primary/20">
            <CardHeader className="p-4 pb-2">
              <Badge variant="premium" className="w-fit mb-2 text-[10px] uppercase">Practice</Badge>
              <CardTitle className="text-lg">Run Simulator</CardTitle>
              <CardDescription>Practice active listening before redirecting in a defensive client scenario.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button className="w-full sm:w-auto" asChild>
                <Link href="/practice">
                  <Play className="mr-2 h-4 w-4" /> Start Practice
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Step 3 - Upcoming */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
          <div className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] border-dashed bg-transparent">
            <CardContent className="p-4 text-muted-foreground">
              <Badge variant="outline" className="mb-2 text-[10px] uppercase opacity-50">Reflect</Badge>
              <h3 className="font-medium text-lg mb-1 opacity-70">Synthesize Lessons</h3>
              <p className="text-sm opacity-70">Extract a principle from the simulator outcome.</p>
            </CardContent>
          </Card>
        </div>

      </div>
      
      <div className="pt-8 text-center">
        <Button variant="ghost" className="text-muted-foreground">
          Skip Sequence <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}
