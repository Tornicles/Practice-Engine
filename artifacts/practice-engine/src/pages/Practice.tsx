import { useListPracticeSessions, useCreatePracticeSession, getListPracticeSessionsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, CheckCircle2, History, Bot, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const SCENARIOS = [
  {
    id: "s1",
    category: "Handling Resistance",
    title: "The Defensive Founder",
    description: "Client deflects questions about team culture and blames external factors.",
    difficulty: "Advanced"
  },
  {
    id: "s2",
    category: "Clarity & Framing",
    title: "The Overwhelmed Leader",
    description: "Client brings 5 different urgent problems to the session. You need to focus them.",
    difficulty: "Intermediate"
  },
  {
    id: "s3",
    category: "Boundaries",
    title: "The Scope Creeper",
    description: "Client asks for direct consulting/done-for-you work instead of coaching.",
    difficulty: "Beginner"
  }
]

export default function Practice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: sessions, isLoading: sessionsLoading } = useListPracticeSessions()
  const createSession = useCreatePracticeSession()

  const [activeScenario, setActiveScenario] = useState<typeof SCENARIOS[0] | null>(null)
  const [sessionState, setSessionState] = useState<"brief" | "simulating" | "feedback">("brief")
  const [reflection, setReflection] = useState("")

  const handleStart = (s: typeof SCENARIOS[0]) => {
    setActiveScenario(s)
    setSessionState("brief")
  }

  const handleBeginSim = () => setSessionState("simulating")

  const handleEndSim = () => setSessionState("feedback")

  const handleSave = () => {
    if (!activeScenario) return

    createSession.mutate({
      data: {
        scenario: activeScenario.title,
        category: activeScenario.category,
        score: Math.floor(Math.random() * 20) + 70, // Mock score generation
        feedback: reflection || "Completed practice scenario successfully."
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Session Saved",
          description: "Your practice score has been updated.",
        })
        queryClient.invalidateQueries({ queryKey: getListPracticeSessionsQueryKey() })
        setActiveScenario(null)
        setReflection("")
      }
    })
  }

  if (activeScenario) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <Button variant="ghost" onClick={() => setActiveScenario(null)} className="-ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
        </Button>

        <div className="space-y-2">
          <div className="flex gap-2 mb-2">
            <Badge variant="outline">{activeScenario.category}</Badge>
            <Badge className={
              activeScenario.difficulty === 'Advanced' ? 'bg-destructive/20 text-destructive' :
              activeScenario.difficulty === 'Intermediate' ? 'bg-primary/20 text-primary' :
              'bg-emerald-500/20 text-emerald-500'
            }>{activeScenario.difficulty}</Badge>
          </div>
          <h1 className="font-serif text-3xl font-medium">{activeScenario.title}</h1>
          <p className="text-lg text-muted-foreground">{activeScenario.description}</p>
        </div>

        {sessionState === "brief" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Session Brief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>In this simulation, the AI will adopt the persona of the client. Your goal is to practice specific interventions appropriate for the scenario.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Demonstrate active listening before redirecting.</li>
                <li>Use open-ended questions to challenge their assumptions gently.</li>
                <li>Maintain a coaching stance (do not give advice).</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button size="lg" onClick={handleBeginSim} className="w-full sm:w-auto">
                <Play className="mr-2 h-4 w-4" /> Start Simulation
              </Button>
            </CardFooter>
          </Card>
        )}

        {sessionState === "simulating" && (
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 pb-4">
              <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">AI Client Simulator</CardTitle>
                <CardDescription>Respond as you would in a real session.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="py-8 min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <Bot className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground max-w-md">
                (Imagine an interactive chat interface here where the coach talks to the AI client and gets real-time evaluation.)
              </p>
              <Button variant="outline" onClick={handleEndSim}>Complete Simulation</Button>
            </CardContent>
          </Card>
        )}

        {sessionState === "feedback" && (
          <Card>
            <CardHeader>
              <CardTitle>Session Review</CardTitle>
              <CardDescription>Reflect on your performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold mb-2">AI Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  You successfully redirected the client after their initial defensive reaction. However, you jumped into problem-solving slightly too early. Next time, try holding silence for 3-5 seconds after they finish speaking to see if they solve it themselves.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Reflection</label>
                <Textarea 
                  placeholder="What did you learn? What principle can you extract?" 
                  className="min-h-[120px]"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={createSession.isPending} className="w-full sm:w-auto">
                {createSession.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Save & Analyze
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Practice Simulator</h1>
        <p className="text-muted-foreground">Hone your skills in a safe environment before facing real clients.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" /> Available Scenarios
          </h2>
          <div className="grid gap-4">
            {SCENARIOS.map(scenario => (
              <Card key={scenario.id} className="hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => handleStart(scenario)}>
                <CardContent className="p-6 flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">{scenario.category}</Badge>
                    </div>
                    <h3 className="font-medium text-lg group-hover:text-primary transition-colors">{scenario.title}</h3>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity">
                    <Play className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" /> Recent History
          </h2>
          
          <Card>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : sessions?.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No practice history yet. Start a simulation to generate proof of skill.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sessions?.slice(0, 5).map(session => (
                    <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{session.scenario}</span>
                        <span className="font-mono text-primary text-sm">{session.score}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>{session.category}</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
