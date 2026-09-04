import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetPracticeProfile, useUpdatePracticeProfile } from "@workspace/api-client-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { data: profile, isLoading } = useGetPracticeProfile();
  const updateProfile = useUpdatePracticeProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    experienceLevel: "",
    audience: "",
    goal: "",
    developmentFocus: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        niche: profile.niche || "",
        experienceLevel: profile.experienceLevel || "",
        audience: profile.audience || "",
        goal: profile.goal || "",
        developmentFocus: profile.developmentFocus || ""
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your settings have been saved successfully." });
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your coach profile and system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coach Profile</CardTitle>
          <CardDescription>This information contextualizes the AI's intelligence generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label>Niche</Label>
                <Input value={formData.niche} onChange={e => setFormData(p => ({...p, niche: e.target.value}))} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Input value={formData.audience} onChange={e => setFormData(p => ({...p, audience: e.target.value}))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Input value={formData.experienceLevel} onChange={e => setFormData(p => ({...p, experienceLevel: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Input value={formData.goal} onChange={e => setFormData(p => ({...p, goal: e.target.value}))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Development Focus</Label>
              <Input value={formData.developmentFocus} onChange={e => setFormData(p => ({...p, developmentFocus: e.target.value}))} />
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}