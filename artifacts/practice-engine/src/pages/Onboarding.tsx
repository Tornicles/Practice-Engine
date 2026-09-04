import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getGetPracticeProfileQueryKey,
  useGetPracticeProfile,
  useUpdatePracticeProfile,
} from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, LogOut } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

import { Step1Welcome, Step2Goals, Step3Profile, Step4Experience, Step5Assessment } from "@/components/onboarding/Steps1To5";
import { Step6Development, Step7Brand, Step8Methodology, Step9Build, Step10FirstExperience } from "@/components/onboarding/Steps6To10";
import { Step11Analysis, Step12Challenge, Step13Plan, Step14Passport } from "@/components/onboarding/Steps11To14";

function deepMerge(target: any, source: any): any {
  if (typeof target !== "object" || target === null) return source;
  if (typeof source !== "object" || source === null) return source;
  if (Array.isArray(target) && Array.isArray(source)) return source; // arrays are replaced

  const output = { ...target };
  Object.keys(source).forEach(key => {
    if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error, refetch } = useGetPracticeProfile();
  const updateProfile = useUpdatePracticeProfile();

  const [step, setStep] = useState(1);
  const [isInitializing, setIsInitializing] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && isInitializing) {
      if (profile.onboardingCompleted) {
        setLocation('/dashboard');
        return;
      }
      if (profile.onboardingStep > 1 && profile.onboardingStep <= 14) {
        setStep(profile.onboardingStep);
      }
      setIsInitializing(false);
    }
  }, [profile, isInitializing, setLocation]);

  const handleNext = async (stepData: any) => {
    setSaveError(null);
    try {
      const nextStep = step + 1;
      const complete = nextStep > 14;

      const currentOnboardingData = profile?.onboardingData || {};
      const newOnboardingData = stepData.onboardingData ? deepMerge(
        currentOnboardingData,
        stepData.onboardingData
      ) : currentOnboardingData;

      const payload = {
        ...stepData,
        onboardingData: newOnboardingData,
        onboardingStep: complete ? 15 : nextStep,
        onboardingCompleted: complete,
      };

      const updatedProfile = await updateProfile.mutateAsync({ data: payload });
      
      // Update cache in place to prevent layout shifts
      queryClient.setQueryData(getGetPracticeProfileQueryKey(), updatedProfile);

      if (complete) {
        trackEvent("onboarding_step_completed", { step: 14 });
        trackEvent("onboarding_completed");
        try { window.localStorage.setItem("onboarding_completed", "true"); } catch {}
        setLocation('/dashboard');
      } else {
        trackEvent("onboarding_step_completed", { step });
        setStep(nextStep);
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save your progress. Please try again.");
    }
  };

  const handleBack = async () => {
    const prevStep = Math.max(1, step - 1);
    if (prevStep === step) return;

    setSaveError(null);
    try {
      const payload = { onboardingStep: prevStep };
      const updatedProfile = await updateProfile.mutateAsync({ data: payload });
      queryClient.setQueryData(getGetPracticeProfileQueryKey(), updatedProfile);

      setStep(prevStep);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setSaveError(err.message || "Failed to go back. Please try again.");
    }
  };
  
  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  if (isLoading || isInitializing) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
        <div className="engine-card bg-card w-full max-w-md p-8 text-center rounded-xl">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to load profile</h2>
          <p className="text-muted-foreground mb-6">We could not load your Startup Man profile.</p>
          <button 
            onClick={() => refetch()} 
            className="h-10 px-4 border border-border rounded-md hover:bg-secondary transition-colors font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    const props = { profile, onNext: handleNext, onBack: handleBack, isSaving: updateProfile.isPending };
    switch (step) {
      case 1: return <Step1Welcome {...props} />;
      case 2: return <Step2Goals {...props} />;
      case 3: return <Step3Profile {...props} />;
      case 4: return <Step4Experience {...props} />;
      case 5: return <Step5Assessment {...props} />;
      case 6: return <Step6Development {...props} />;
      case 7: return <Step7Brand {...props} />;
      case 8: return <Step8Methodology {...props} />;
      case 9: return <Step9Build {...props} />;
      case 10: return <Step10FirstExperience {...props} />;
      case 11: return <Step11Analysis {...props} />;
      case 12: return <Step12Challenge {...props} />;
      case 13: return <Step13Plan {...props} />;
      case 14: return <Step14Passport {...props} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-noisy flex flex-col">
      <header className="flex h-[72px] items-center justify-between px-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="engine-logo-mark grid h-7 w-7 place-items-center rounded-sm text-xs font-bold border border-primary/50 text-primary" aria-hidden="true">S</span>
          <span className="text-[13px] font-semibold uppercase tracking-[.16em] text-foreground hidden sm:inline-block">
            Startup <span className="text-primary">Man</span>
          </span>
        </div>
        
        {step > 1 && (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Step {step} <span className="text-border mx-1">/</span> 14
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[.08em] flex items-center gap-2"
        >
          <LogOut className="h-3 w-3" /> Sign Out
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-3xl">
          
          {step > 1 && (
            <div className="mb-6 h-1 w-full bg-secondary/50 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${(step / 14) * 100}%` }}
              />
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{saveError}</p>
            </div>
          )}

          <div className="engine-card bg-card/60 backdrop-blur-sm border-border/60 shadow-2xl rounded-xl overflow-hidden min-h-[600px] flex flex-col">
            {renderStep()}
          </div>
        </div>
      </main>
    </div>
  );
}
