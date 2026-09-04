import { useListPracticeSessions, useCreatePracticeSession, useSimulateClientTurn, getListPracticeSessionsQueryKey, ConversationMessage } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, CheckCircle2, History, Bot, Loader2, ArrowLeft, Send, User } from "lucide-react"
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
  const simulateTurn = useSimulateClientTurn()

  const [activeScenario, setActiveScenario] = useState<typeof SCENARIOS[0] | null>(null)
  const [sessionState, setSessionState] = useState<"brief" | "simulating" | "feedback">("brief")
  
  const [history, setHistory] = useState<ConversationMessage[]>([])
  const [coachInput, setCoachInput] = useState("")
  const [latestObservation, setLatestObservation] = useState("")
  const [latestSkill, setLatestSkill] = useState("")
  const [currentScore, setCurrentScore] = useState(0)
  
  const [reflection, setReflection] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history])

  const handleStart = (s: typeof SCENARIOS[0]) => {
    setActiveScenario(s)
    setHistory([])
    setCoachInput("")
    setLatestObservation("")
    setLatestSkill("")
    setCurrentScore(0)
    setSessionState("brief")
  }

  const handleBeginSim = () => setSessionState("simulating")

  const handleSendTurn = () => {
    if (!coachInput.trim() || !activeScenario) return;

    const newMessage: ConversationMessage = { role: "coach", content: coachInput };
    const currentHistory = [...history];
    setHistory(prev => [...prev, newMessage]);
    setCoachInput("");

    simulateTurn.mutate({
      data: {
        scenario: activeScenario.title,
        category: activeScenario.category,
        difficulty: activeScenario.difficulty,
        coachMessage: newMessage.content,
        history: currentHistory
      }
    }, {
      onSuccess: (res) => {
        setHistory(prev => [...prev, { role: "client", content: res.clientReply }]);
        setLatestObservation(res.observation);
        setLatestSkill(res.skill);
        setCurrentScore(res.score);
        
        if (res.sessionComplete) {
          toast({
            title: "Session Completed",
            description: "The AI has concluded the scenario. Proceed to reflection.",
          })
          setTimeout(() => setSessionState("feedback"), 2000);
        }
      }
    })
  }

  const handleSave = () => {
    if (!activeScenario) return

    createSession.mutate({
      data: {
        scenario: activeScenario.title,
        category: activeScenario.category,
        score: currentScore || 85,
        feedback: reflection
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
      <div className="mx-auto max-w-5xl space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
        <Button variant="ghost" onClick={() => setActiveScenario(null)} className="-ml-3 text-xs uppercase tracking-wider text-muted-foreground" data-testid="button-practice-back">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
        </Button>

        <div className="space-y-2">
           <div className="mb-2 flex gap-2">
            <Badge variant="outline">{activeScenario.category}</Badge>
            <Badge className={
              activeScenario.difficulty === 'Advanced' ? 'bg-destructive/20 text-destructive' :
              activeScenario.difficulty === 'Intermediate' ? 'bg-primary/20 text-primary' :
              'bg-emerald-500/20 text-emerald-500'
            }>{activeScenario.difficulty}</Badge>
          </div>
           <div className="engine-kicker mb-2">SIMULATOR / ACTIVE SCENARIO</div>
           <h1 className="engine-section-title">{activeScenario.title}</h1>
           <p className="mt-2 text-sm text-muted-foreground">{activeScenario.description}</p>
        </div>

        {sessionState === "brief" && (
           <Card className="engine-card border-primary/25 bg-primary/[.04]">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
               <Card className="engine-card flex h-[600px] flex-col">
                <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 py-4 bg-muted/20">
                  <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Client Simulator</CardTitle>
                    <CardDescription>Respond as you would in a real session.</CardDescription>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setSessionState("feedback")}>
                      End Session
                    </Button>
                  </div>
                </CardHeader>
                <CardContent 
                  className="flex-1 overflow-y-auto p-6 space-y-6 bg-card"
                  ref={scrollRef}
                >
                  {history.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 opacity-50">
                      <Bot className="h-12 w-12" />
                      <p>You enter the session. Speak to the client to begin.</p>
                    </div>
                  )}
                  {history.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'coach' ? 'justify-end' : ''}`}>
                      {msg.role === 'client' && (
                        <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className={`p-4 rounded-xl max-w-[80%] ${
                        msg.role === 'coach' 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-muted rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === 'coach' && (
                        <div className="h-8 w-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {simulateTurn.isPending && (
                    <div className="flex gap-4">
                      <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="p-4 rounded-xl bg-muted rounded-bl-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Client is typing...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 border-t border-border/50 bg-background">
                  <form 
                    className="flex gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleSendTurn(); }}
                  >
                    <Textarea 
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      placeholder="What do you say to the client?"
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendTurn();
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      className="h-auto px-6"
                      disabled={simulateTurn.isPending || !coachInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
            
             <div className="space-y-6">
               <Card className="engine-card border-border">
                <CardHeader className="bg-primary/5 border-b border-border/50 py-4">
                  <CardTitle className="text-sm uppercase tracking-wider text-primary">Private Observation</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {latestObservation ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Live Feedback</h4>
                        <p className="text-sm text-foreground leading-relaxed">{latestObservation}</p>
                      </div>
                      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill Focus</h4>
                          <p className="text-sm font-medium mt-1">{latestSkill}</p>
                        </div>
                        <div className="text-right">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Score</h4>
                          <p className="text-2xl font-mono text-primary font-bold mt-1">{currentScore}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8 opacity-60">
                      Interact with the client to receive live coaching observations.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {sessionState === "feedback" && (
           <Card className="engine-card">
            <CardHeader>
              <CardTitle>Session Reflection</CardTitle>
              <CardDescription>Consolidate your learning to finalize the score.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Final Score</h4>
                  <p className="text-3xl font-mono text-primary">{currentScore || 85}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Skill Focus</h4>
                  <p className="text-sm font-medium">{latestSkill || "Active Listening & Redirect"}</p>
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4" /> AI Supervisor Notes
                </h4>
                <p className="text-sm text-muted-foreground">
                  {latestObservation || "You handled the resistance well, but ensure you give the client enough silence to solve their own problem before jumping in with frameworks."}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Reflection</label>
                <Textarea 
                  placeholder="What did you learn? What principle can you extract from this?" 
                  className="min-h-[120px]"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={createSession.isPending || !reflection.trim()} className="w-full sm:w-auto">
                {createSession.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Save & Update Passport
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div>
         <div className="engine-kicker mb-3">WORKSPACE / DELIBERATE PRACTICE</div>
         <h1 className="engine-section-title">Practice Simulator</h1>
         <p className="mt-2 text-sm text-muted-foreground">Hone your skills in a safe environment before facing real clients.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" /> Available Scenarios
          </h2>
          <div className="grid gap-4">
            {SCENARIOS.map(scenario => (
             <Card key={scenario.id} className="engine-card cursor-pointer transition-colors group hover:border-primary/50" onClick={() => handleStart(scenario)} data-testid={`card-scenario-${scenario.id}`}>
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
          
           <Card className="engine-card">
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