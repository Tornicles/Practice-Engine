import { useGetPracticeProfile, useUpdatePracticeProfile, getGetPracticeOverviewQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"

export default function Settings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useGetPracticeProfile()
  const updateProfile = useUpdatePracticeProfile()

  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    audience: "",
    experienceLevel: "",
    developmentFocus: ""
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        niche: profile.niche || "",
        audience: profile.audience || "",
        experienceLevel: profile.experienceLevel || "",
        developmentFocus: profile.developmentFocus || ""
      })
    }
  }, [profile])

  const handleSave = () => {
    updateProfile.mutate({
      data: formData
    }, {
      onSuccess: () => {
        toast({ title: "Profile updated", description: "Your settings have been saved successfully." })
        queryClient.invalidateQueries({ queryKey: getGetPracticeOverviewQueryKey() })
      }
    })
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your coach profile and system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coach Profile</CardTitle>
          <CardDescription>This information grounds the AI when simulating clients or extracting principles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.experienceLevel}
                onChange={e => setFormData(p => ({...p, experienceLevel: e.target.value}))}
              >
                <option value="Beginner (0-2 years)">Beginner (0-2 years)</option>
                <option value="Intermediate (3-5 years)">Intermediate (3-5 years)</option>
                <option value="Advanced (5-10 years)">Advanced (5-10 years)</option>
                <option value="Master (10+ years)">Master (10+ years)</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Niche / Domain</Label>
            <Input value={formData.niche} onChange={e => setFormData(p => ({...p, niche: e.target.value}))} />
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Input value={formData.audience} onChange={e => setFormData(p => ({...p, audience: e.target.value}))} />
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label className="text-primary">Current Development Focus</Label>
            <p className="text-xs text-muted-foreground mb-2">This drives your daily jobs and practice scenarios.</p>
            <Input value={formData.developmentFocus} onChange={e => setFormData(p => ({...p, developmentFocus: e.target.value}))} />
          </div>

        </CardContent>
        <CardFooter className="bg-muted/20 border-t border-border/50 py-4 flex justify-between">
          <p className="text-sm text-muted-foreground">Changes apply immediately across the engine.</p>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
