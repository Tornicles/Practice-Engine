import { useListExperiences, useCreateExperience, useExtractExperienceKnowledge, getListExperiencesQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Plus, Loader2, Sparkles, Layers, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Link } from "wouter"

export default function Knowledge() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: experiences, isLoading } = useListExperiences()
  
  const createExp = useCreateExperience()
  const extractKnowledge = useExtractExperienceKnowledge()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState<"input" | "extracted">("input")
  
  // Step 1 input
  const [rawSituation, setRawSituation] = useState("")
  const [rawReflection, setRawReflection] = useState("")
  
  // Step 2 result/edit
  const [formData, setFormData] = useState({
    title: "",
    situation: "",
    learning: "",
    principle: "",
    insight: "",
    frameworkCandidate: "",
  })

  const handleExtract = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawSituation || !rawReflection) return

    extractKnowledge.mutate({
      data: {
        title: "New Experience",
        situation: rawSituation,
        coachReflection: rawReflection
      }
    }, {
      onSuccess: (res) => {
        setFormData({
          title: res.title,
          situation: rawSituation,
          learning: res.lesson,
          principle: res.principle,
          insight: res.insight,
          frameworkCandidate: res.frameworkCandidate
        })
        setStep("extracted")
      }
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Append insight to learning since schema only supports basic fields, or just keep core
    const finalLearning = `${formData.learning}\n\nInsight: ${formData.insight}`;

    createExp.mutate({
      data: {
        clientRequestId: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        title: formData.title,
        situation: formData.situation,
        learning: finalLearning,
        principle: formData.principle
      }
    }, {
      onSuccess: () => {
        toast({ title: "Experience captured", description: "Added to your knowledge vault." })
        queryClient.invalidateQueries({ queryKey: getListExperiencesQueryKey() })
        resetModal()
      }
    })
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setStep("input")
      setRawSituation("")
      setRawReflection("")
      setFormData({ title: "", situation: "", learning: "", principle: "", insight: "", frameworkCandidate: "" })
    }, 300)
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
           <div className="engine-kicker mb-3">DEVELOPMENT / LIVED EXPERIENCE</div>
           <h1 className="engine-section-title">Knowledge Vault</h1>
           <p className="mt-2 text-sm text-muted-foreground">Capture real experiences and extract repeatable principles.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetModal(); else setIsModalOpen(true); }}>
          <DialogTrigger asChild>
             <Button className="shrink-0 uppercase tracking-[.08em]"><Plus className="mr-2 h-4 w-4" /> Capture experience</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {step === "input" ? <><FileText className="h-5 w-5 text-primary" /> Capture Raw Experience</> : <><Sparkles className="h-5 w-5 text-primary" /> Extracted Principles</>}
              </DialogTitle>
              <DialogDescription>
                {step === "input" ? "Dump your unpolished thoughts. The AI will extract the underlying methodology." : "Review and refine the extracted structural knowledge before saving."}
              </DialogDescription>
            </DialogHeader>
            
            {step === "input" ? (
              <form onSubmit={handleExtract} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>What happened? (Situation)</Label>
                  <Textarea 
                    required
                    className="min-h-[120px]"
                    placeholder="Client had 3 urgent problems, kept jumping between them..." 
                    value={rawSituation} 
                    onChange={e => setRawSituation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>What did you learn or observe? (Reflection)</Label>
                  <Textarea 
                    required
                    className="min-h-[120px]"
                    placeholder="I noticed the problem wasn't time management, it was lack of clarity..." 
                    value={rawReflection} 
                    onChange={e => setRawReflection(e.target.value)}
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={extractKnowledge.isPending} className="w-full sm:w-auto">
                    {extractKnowledge.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Extract Methodology
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handleSave} className="space-y-6 py-4 animate-in slide-in-from-right-8">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lesson</Label>
                    <Textarea className="min-h-[80px] resize-none" value={formData.learning} onChange={e => setFormData(p => ({...p, learning: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Insight</Label>
                    <Textarea className="min-h-[80px] resize-none" value={formData.insight} onChange={e => setFormData(p => ({...p, insight: e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2 bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <Label className="text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Core Principle</Label>
                  <Input 
                    required
                    className="bg-background border-primary/30 mt-2 font-medium"
                    value={formData.principle} 
                    onChange={e => setFormData(p => ({...p, principle: e.target.value}))}
                  />
                </div>
                {formData.frameworkCandidate && (
                  <div className="space-y-2 bg-secondary/30 p-4 rounded-lg border border-border">
                    <Label className="flex items-center gap-2"><Layers className="h-4 w-4" /> Framework Candidate</Label>
                    <p className="text-sm mt-1 font-mono text-muted-foreground">{formData.frameworkCandidate}</p>
                    <p className="text-xs text-muted-foreground mt-2">You can synthesize this into a formal framework in the Methodology Engine.</p>
                  </div>
                )}
                <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setStep("input")}>Back</Button>
                  <Button type="submit" disabled={createExp.isPending}>
                    {createExp.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save to Vault"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </>
        ) : experiences?.length === 0 ? (
           <div className="col-span-full border border-dashed border-border bg-card/50 py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Your vault is empty</h3>
            <p className="text-muted-foreground mb-4">Start capturing experiences to build your distinctive methodology.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Capture First Experience</Button>
          </div>
        ) : (
          experiences?.map(exp => (
             <Card key={exp.id} className="engine-card flex flex-col hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={exp.status === 'processed' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                    {exp.status || "Raw"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(exp.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{exp.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Situation</span>
                    <p className="text-sm line-clamp-2 text-foreground/80">{exp.situation}</p>
                  </div>
                   <div className="border border-primary/15 bg-primary/[.045] p-3">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Principle
                    </span>
                    <p className="text-sm font-medium text-foreground">{exp.principle}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-border/50 bg-muted/10 grid grid-cols-2 p-0">
                <Link href={`/methodology?experienceId=${exp.id}`} className="flex items-center justify-center p-3 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border-r border-border/50">
                  Build Framework
                </Link>
                <Link href={`/content?experienceId=${exp.id}`} className="flex items-center justify-center p-3 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  Create Content
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}