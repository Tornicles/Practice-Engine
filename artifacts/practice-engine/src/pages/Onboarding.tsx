import { useState } from "react"
import { useLocation } from "wouter"
import { useUpdatePracticeProfile } from "@workspace/api-client-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Loader2, Zap } from "lucide-react"

export default function Onboarding() {
  const [, setLocation] = useLocation()
  const updateProfile = useUpdatePracticeProfile()
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    audience: "",
    experienceLevel: "",
    goal: "",
  })

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)
  
  const handleComplete = () => {
    updateProfile.mutate({
      data: {
        name: formData.name,
        niche: formData.niche,
        audience: formData.audience,
        experienceLevel: formData.experienceLevel,
        goal: formData.goal,
      }
    }, {
      onSuccess: () => {
        setLocation('/dashboard')
      }
    })
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.3)] mb-4">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Practice Engine</h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            The professional training studio for coaches who want to master their craft and build distinct intellectual property.
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Your Identity</CardTitle>
                <CardDescription>Let's start with the basics of your practice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Jane Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niche">Your Niche / Domain</Label>
                  <Input 
                    id="niche" 
                    placeholder="e.g., Executive Leadership, Creator Performance" 
                    value={formData.niche}
                    onChange={(e) => setFormData(p => ({ ...p, niche: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input 
                    id="audience" 
                    placeholder="e.g., Series B Founders, Agency Owners" 
                    value={formData.audience}
                    onChange={(e) => setFormData(p => ({ ...p, audience: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleNext}
                  disabled={!formData.name}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Your Experience & Goals</CardTitle>
                <CardDescription>Tailor the engine to your current level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <select 
                    id="experienceLevel" 
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData(p => ({ ...p, experienceLevel: e.target.value }))}
                  >
                    <option value="" disabled>Select level...</option>
                    <option value="Beginner (0-2 years)">Beginner (0-2 years)</option>
                    <option value="Intermediate (3-5 years)">Intermediate (3-5 years)</option>
                    <option value="Advanced (5-10 years)">Advanced (5-10 years)</option>
                    <option value="Master (10+ years)">Master (10+ years)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Primary Focus Right Now</Label>
                  <Textarea 
                    id="goal" 
                    placeholder="e.g., I want to productize my framework into a signature course, or I need more confidence handling difficult client resistance..." 
                    className="h-24 resize-none"
                    value={formData.goal}
                    onChange={(e) => setFormData(p => ({ ...p, goal: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="w-1/3">Back</Button>
                <Button 
                  className="w-2/3" 
                  onClick={handleComplete}
                  disabled={updateProfile.isPending || !formData.experienceLevel}
                >
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter Studio"}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
