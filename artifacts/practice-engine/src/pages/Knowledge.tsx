import { useListExperiences, useCreateExperience, getListExperiencesQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Plus, Loader2, Sparkles, MoveRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

export default function Knowledge() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: experiences, isLoading } = useListExperiences()
  const createExp = useCreateExperience()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    situation: "",
    learning: "",
    principle: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createExp.mutate({
      data: formData
    }, {
      onSuccess: () => {
        toast({ title: "Experience captured", description: "Added to your knowledge vault." })
        queryClient.invalidateQueries({ queryKey: getListExperiencesQueryKey() })
        setIsModalOpen(false)
        setFormData({ title: "", situation: "", learning: "", principle: "" })
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Knowledge Vault</h1>
          <p className="text-muted-foreground">Capture real experiences and extract repeatable principles.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0"><Plus className="mr-2 h-4 w-4" /> Capture Experience</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Capture Experience</DialogTitle>
              <DialogDescription>Convert a recent client interaction into a reusable principle.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title / Summary</Label>
                <Input 
                  required
                  placeholder="e.g., The Founder who couldn't delegate" 
                  value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>What happened? (Situation)</Label>
                <Textarea 
                  required
                  className="min-h-[80px]"
                  placeholder="Client had 3 urgent problems, kept jumping between them..." 
                  value={formData.situation} onChange={e => setFormData(p => ({...p, situation: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>What did you learn?</Label>
                <Textarea 
                  required
                  className="min-h-[80px]"
                  placeholder="The problem wasn't time management, it was lack of clarity on the primary bottleneck." 
                  value={formData.learning} onChange={e => setFormData(p => ({...p, learning: e.target.value}))}
                />
              </div>
              <div className="space-y-2 bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <Label className="text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Extracted Principle</Label>
                <Input 
                  required
                  className="bg-transparent border-primary/30 mt-2"
                  placeholder="e.g., Diagnose clarity before attempting motivation." 
                  value={formData.principle} onChange={e => setFormData(p => ({...p, principle: e.target.value}))}
                />
                <p className="text-xs text-muted-foreground mt-2">This principle can later be used in your Methodology and Content.</p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createExp.isPending}>
                  {createExp.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save to Vault"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </>
        ) : experiences?.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-card/50">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Your vault is empty</h3>
            <p className="text-muted-foreground mb-4">Start capturing experiences to build your distinctive methodology.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Capture First Experience</Button>
          </div>
        ) : (
          experiences?.map(exp => (
            <Card key={exp.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={exp.status === 'processed' ? 'premium' : 'secondary'} className="text-[10px] uppercase">
                    {exp.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(exp.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-lg leading-tight">{exp.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4 pb-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Situation</span>
                    <p className="text-sm line-clamp-2">{exp.situation}</p>
                  </div>
                  <div className="bg-primary/5 rounded-md p-3 border border-primary/10">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Principle
                    </span>
                    <p className="text-sm font-medium text-foreground">{exp.principle}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-border/50 bg-muted/20">
                <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground text-sm mt-2 h-8">
                  Synthesize <MoveRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
