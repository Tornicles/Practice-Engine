import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  getGetPracticeProfileQueryKey,
  useGetPracticeProfile,
  useUpdatePracticeProfile,
} from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Zap, ArrowLeft, LogOut, AlertCircle } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useGetPracticeProfile();
  const updateProfile = useUpdatePracticeProfile();
  
  const [step, setStep] = useState(1);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    audience: "",
    experienceLevel: "",
    goal: "",
    developmentFocus: "",
    workingPreferences: "",
  });

  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && isInitializing) {
      setFormData({
        name: profile.name || user?.fullName || "",
        niche: profile.niche || "",
        audience: profile.audience || "",
        experienceLevel: profile.experienceLevel || "",
        goal: profile.goal || "",
        developmentFocus: profile.developmentFocus || "",
        workingPreferences: profile.workingPreferences || "",
      });
      
      if (profile.onboardingCompleted) {
        setLocation('/dashboard');
        return;
      }
      
      if (profile.onboardingStep > 1 && profile.onboardingStep <= 4) {
        setStep(profile.onboardingStep);
      }
      
      setIsInitializing(false);
    }
  }, [profile, isInitializing, user, setLocation]);

  const saveStepData = async (nextStep: number, complete: boolean = false) => {
    setSaveError(null);
    try {
      const updatedProfile = await updateProfile.mutateAsync({
        data: {
          ...formData,
          onboardingStep: complete ? 4 : nextStep,
          onboardingCompleted: complete,
        }
      });
      queryClient.setQueryData(getGetPracticeProfileQueryKey(), updatedProfile);
      
      if (complete) {
        setLocation('/dashboard');
      } else {
        setStep(nextStep);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save your progress. Please try again.");
    }
  };

  const handleNext = () => saveStepData(step + 1);
  const handleBack = () => setStep((s) => s - 1);
  const handleComplete = () => saveStepData(4, true);
  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  if (isLoadingProfile || isInitializing) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
        <Card className="engine-card bg-card w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <CardTitle>Unable to load profile</CardTitle>
            <CardDescription>We could not load your practice engine profile.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-noisy flex flex-col">
      <header className="flex h-[72px] items-center justify-between px-6 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="engine-logo-mark grid h-7 w-7 place-items-center rounded-sm text-xs font-bold border border-primary/50 text-primary">P</span>
          <span className="text-[13px] font-semibold uppercase tracking-[.16em] text-foreground hidden sm:inline-block">
            Practice<span className="text-primary">Engine</span>
          </span>
        </div>
        <button 
          onClick={handleSignOut}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[.08em] flex items-center gap-2"
        >
          <LogOut className="h-3 w-3" /> Sign Out
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center space-y-4">
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center border border-primary/40 bg-primary/10 text-primary rounded-sm shadow-[0_0_15px_rgba(201,168,78,0.15)]">
              <Zap className="h-6 w-6" />
            </div>
            <h1 className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
              Build your Coach Passport
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              The engine needs context to build your intellectual property. Define your identity, constraints, and operational focus.
            </p>
          </div>

          <div className="mb-8 flex justify-center gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-2 rounded-sm transition-all duration-300 ${
                  i === step ? "w-12 bg-primary" : i < step ? "w-6 bg-primary/40" : "w-6 bg-secondary"
                }`} 
              />
            ))}
          </div>

          {saveError && (
            <div className="mb-6 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{saveError}</p>
            </div>
          )}

          <Card className="engine-card bg-card/60 backdrop-blur-sm border-border/60 shadow-2xl">
            {step === 1 && (
              <>
                <CardHeader className="pb-6">
                  <div className="engine-kicker mb-2">Layer 01</div>
                  <CardTitle className="text-2xl">Your Identity</CardTitle>
                  <CardDescription className="text-sm">Establish the foundational context of your practice.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Your Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your professional name" 
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="h-12 bg-background/50 text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="niche" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Your Domain / Niche</Label>
                    <Input 
                      id="niche" 
                      placeholder="e.g., Executive Leadership, Creator Performance" 
                      value={formData.niche}
                      onChange={(e) => setFormData(p => ({ ...p, niche: e.target.value }))}
                      className="h-12 bg-background/50 text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="audience" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Target Audience</Label>
                    <Input 
                      id="audience" 
                      placeholder="e.g., Series B Founders, Agency Owners" 
                      value={formData.audience}
                      onChange={(e) => setFormData(p => ({ ...p, audience: e.target.value }))}
                      className="h-12 bg-background/50 text-base"
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-6 pb-8 border-t border-border/50 mt-4">
                  <Button 
                    className="w-full h-12 text-sm font-bold uppercase tracking-[.1em]" 
                    onClick={handleNext}
                    disabled={!formData.name || !formData.niche || updateProfile.isPending}
                  >
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader className="pb-6">
                  <div className="engine-kicker mb-2">Layer 02</div>
                  <CardTitle className="text-2xl">Experience & Objectives</CardTitle>
                  <CardDescription className="text-sm">Calibrate the engine to your current level of mastery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="experienceLevel" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Experience Level</Label>
                    <select 
                      id="experienceLevel" 
                      className="flex h-12 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData(p => ({ ...p, experienceLevel: e.target.value }))}
                    >
                      <option value="" disabled>Select your level...</option>
                      <option value="Beginner (0-2 years)">Developing (0-2 years)</option>
                      <option value="Intermediate (3-5 years)">Established (3-5 years)</option>
                      <option value="Advanced (5-10 years)">Advanced (5-10 years)</option>
                      <option value="Master (10+ years)">Master (10+ years)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="goal" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Primary Development Goal</Label>
                    <Textarea 
                      id="goal" 
                      placeholder="e.g., I want to turn my 1:1 framework into a signature scalable course, or I need to build unshakeable confidence handling client resistance..." 
                      className="min-h-[120px] resize-none bg-background/50 text-base p-4"
                      value={formData.goal}
                      onChange={(e) => setFormData(p => ({ ...p, goal: e.target.value }))}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4 pt-6 pb-8 border-t border-border/50 mt-4">
                  <Button variant="outline" onClick={handleBack} className="h-12 w-1/3 bg-transparent hover:bg-secondary/50 border-border">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    className="h-12 w-2/3 text-sm font-bold uppercase tracking-[.1em]" 
                    onClick={handleNext}
                    disabled={updateProfile.isPending || !formData.experienceLevel || !formData.goal}
                  >
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader className="pb-6">
                  <div className="engine-kicker mb-2">Layer 03</div>
                  <CardTitle className="text-2xl">Focus & Constraints</CardTitle>
                  <CardDescription className="text-sm">Define how the system should extract and structure your IP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="developmentFocus" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Core Competency Focus</Label>
                    <select 
                      id="developmentFocus" 
                      className="flex h-12 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                      value={formData.developmentFocus}
                      onChange={(e) => setFormData(p => ({ ...p, developmentFocus: e.target.value }))}
                    >
                      <option value="" disabled>Select primary focus...</option>
                      <option value="Methodology Extraction">Methodology Extraction (Frameworks & Models)</option>
                      <option value="Proof & Case Studies">Evidence Building (Proof & Case Studies)</option>
                      <option value="Skill Acquisition">Skill Acquisition (Simulations & Drills)</option>
                      <option value="Content & Brand">Authority Building (Content & Brand)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="workingPreferences" className="text-xs uppercase tracking-[.08em] text-muted-foreground">Operating Preferences</Label>
                    <Textarea 
                      id="workingPreferences" 
                      placeholder="e.g., Keep generated content highly concise. I lean heavily on Socratic questioning. Do not use corporate jargon..." 
                      className="min-h-[120px] resize-none bg-background/50 text-base p-4"
                      value={formData.workingPreferences}
                      onChange={(e) => setFormData(p => ({ ...p, workingPreferences: e.target.value }))}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4 pt-6 pb-8 border-t border-border/50 mt-4">
                  <Button variant="outline" onClick={handleBack} className="h-12 w-1/3 bg-transparent hover:bg-secondary/50 border-border">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    className="h-12 w-2/3 text-sm font-bold uppercase tracking-[.1em]" 
                    onClick={handleNext}
                    disabled={updateProfile.isPending || !formData.developmentFocus}
                  >
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader className="pb-6 border-b border-border/50">
                  <div className="engine-kicker mb-2 text-primary">System Ready</div>
                  <CardTitle className="text-2xl">Initialization Complete</CardTitle>
                  <CardDescription className="text-sm">Your practice architecture is established.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-4">
                  <div className="relative rounded-md border border-border/50 bg-background/40 p-8 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                    <div className="relative z-10">
                      <div className="mb-4 font-mono text-sm font-bold tracking-[.15em] text-foreground uppercase">
                        Experience <span className="text-primary mx-2">→</span> Expertise <span className="text-primary mx-2">→</span> IP
                      </div>
                      <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                        Capture what you live. Reflect on it. Practice it. Prove it. Turn it into something valuable.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4 pt-6 pb-8 border-t border-border/50 mt-4">
                  <Button variant="outline" onClick={handleBack} className="h-12 w-1/4 bg-transparent hover:bg-secondary/50 border-border" disabled={updateProfile.isPending}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="h-12 w-3/4 text-sm font-bold uppercase tracking-[.1em] shadow-[0_0_15px_rgba(201,168,78,0.2)]" 
                    onClick={handleComplete}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter the Engine"}
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
