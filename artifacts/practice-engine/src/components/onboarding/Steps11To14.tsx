import React, { useState, useEffect, useRef } from "react";
import { StepProps, StepHeader, FooterActions } from "./Shared";
import { useExtractExperienceKnowledge, useSimulateClientTurn, useCreatePracticeSession, ExperienceExtractionResult, SimulationTurnResult } from "@workspace/api-client-react";

export function Step11Analysis({ profile, onNext, onBack, isSaving }: StepProps) {
  const [result, setResult] = useState<ExperienceExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedLesson, setEditedLesson] = useState("");
  const [editedPrinciple, setEditedPrinciple] = useState("");
  const [editedFramework, setEditedFramework] = useState("");

  const extract = useExtractExperienceKnowledge();
  const calledRef = useRef(false);

  const runExtraction = async () => {
    setIsExtracting(true);
    setError(null);
    const answers = profile.onboardingData?.firstExperience || {};
    const title = (answers.whatHappened as string) || "Coaching Experience";
    const situation = (answers.whoWasInvolved as string) || "Context";
    const reflection = [
      answers.whatDidYouDo,
      answers.whatWereYouThinking,
      answers.whatWorked,
      answers.whatDidNotWork,
      answers.whatDidYouLearn,
      answers.whatWillYouDoDifferently
    ].filter(Boolean).join("\n\n");

    try {
      const res = await extract.mutateAsync({
        data: {
          title,
          situation,
          coachReflection: reflection || "General reflection"
        }
      });
      setResult(res);
      setEditedLesson(res.lesson);
      setEditedPrinciple(res.principle);
      setEditedFramework(res.frameworkCandidate);
    } catch (e: any) {
      setError(e.message || "Failed to extract experience. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const existing = profile.onboardingData?.experienceAnalysis;
    if (existing && existing.lesson) {
      setResult({
        title: existing.experience || "Coaching Experience",
        lesson: existing.lesson,
        principle: existing.principle || "",
        frameworkCandidate: existing.framework || "",
        insight: "",
        evidenceGap: ""
      } as ExperienceExtractionResult);
      setEditedLesson(existing.lesson);
      setEditedPrinciple(existing.principle || "");
      setEditedFramework(existing.framework || "");
      setIsExtracting(false);
    } else {
      runExtraction();
    }
  }, [extract, profile.onboardingData?.firstExperience]);

  if (isExtracting) {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Analyzing Experience</h3>
        <p className="text-muted-foreground text-sm">Extracting lessons, principles, and frameworks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[400px] animate-in fade-in duration-500 p-8 text-center">
        <div className="text-destructive mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-2">Extraction Failed</h3>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <button
          onClick={runExtraction}
          className="h-10 px-6 bg-primary text-primary-foreground rounded-md text-sm font-bold uppercase tracking-[.1em] hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  const handleNext = (reviewState: 'accepted' | 'rejected') => {
    onNext({
      onboardingData: {
        experienceAnalysis: {
          reviewState,
          experience: result?.title,
          lesson: editedLesson,
          principle: editedPrinciple,
          framework: editedFramework
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-500">
      <StepHeader
        layer="Layer 11"
        title="Experience Analysis"
        description="Here is what the Engine extracted from your lived experience."
      />
      <div className="p-8 flex-1 overflow-y-auto space-y-8 max-h-[60vh]">
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Your Experience</h4>
            <p className="text-lg font-medium text-foreground">{result?.title}</p>
          </div>
          <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>

          <div className="text-center space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Your Lesson</h4>
            {isEditing ? (
              <textarea
                value={editedLesson}
                onChange={e => setEditedLesson(e.target.value)}
                className="w-full min-h-[80px] p-3 text-center border rounded bg-background text-primary resize-none"
              />
            ) : (
              <p className="text-lg font-medium text-primary">{editedLesson}</p>
            )}
          </div>
          <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>

          <div className="text-center space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Potential Principle</h4>
            {isEditing ? (
              <textarea
                value={editedPrinciple}
                onChange={e => setEditedPrinciple(e.target.value)}
                className="w-full min-h-[80px] p-3 text-center border rounded bg-background resize-none"
              />
            ) : (
              <p className="text-lg font-medium text-foreground">{editedPrinciple}</p>
            )}
          </div>
          <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>

          <div className="text-center space-y-2 p-6 rounded-md bg-secondary/30 border border-border/50">
            <h4 className="text-xs uppercase tracking-widest text-primary font-bold">Potential Framework</h4>
            {isEditing ? (
              <textarea
                value={editedFramework}
                onChange={e => setEditedFramework(e.target.value)}
                className="w-full min-h-[80px] p-3 text-center border rounded bg-background font-bold text-xl mt-2 resize-none"
              />
            ) : (
              <p className="text-xl font-bold text-foreground mt-2">{editedFramework}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-4 p-6 border-t border-border/40 bg-background/40">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="flex-1 h-12 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleNext('accepted')}
              disabled={isSaving}
              className="flex-1 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-bold uppercase tracking-[.1em] hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(201,168,78,0.15)]"
            >
              Confirm Edits
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNext('rejected')}
              disabled={isSaving}
              className="flex-1 h-12 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className="flex-1 h-12 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-secondary/50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleNext('accepted')}
              disabled={isSaving}
              className="flex-1 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-bold uppercase tracking-[.1em] hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(201,168,78,0.15)]"
            >
              Accept
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function Step12Challenge({ profile, onNext, onBack, isSaving }: StepProps) {
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [response, setResponse] = useState("");
  const [result, setResult] = useState<SimulationTurnResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | undefined>(undefined);

  const simulate = useSimulateClientTurn();
  const saveSession = useCreatePracticeSession();

  const SCENARIO = "I know what I need to do. I just don't understand why you're asking me all these questions.";

  const handleSubmit = async () => {
    setPhase("loading");
    setError(null);
    let simRes: SimulationTurnResult;
    try {
      simRes = await simulate.mutateAsync({
        data: {
          scenario: `Client says: ${SCENARIO}`,
          category: "Handling Resistance",
          difficulty: "intermediate",
          coachMessage: response,
          history: []
        }
      });
    } catch (e: any) {
      setError(e.message || "Simulation failed to evaluate response. Please try again.");
      setPhase("input");
      return;
    }

    setResult(simRes);
    let sessionId = undefined;

    try {
      const sessRes = await saveSession.mutateAsync({
        data: {
          clientRequestId: `${profile.id}-onboarding-challenge-session`,
          scenario: "Onboarding Challenge",
          category: "Resistance",
          score: simRes.score,
          feedback: simRes.observation
        }
      });
      setSessionId(sessRes.id);
    } catch (e: any) {
      setError(e.message || "Failed to save practice session. Please try again.");
      setPhase("input");
      return;
    }

    setPhase("result");
  };

  if (phase === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Evaluating Response</h3>
        <p className="text-muted-foreground text-sm">Analyzing listening, judgment, and intervention choice...</p>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-500">
        <StepHeader
          layer="Layer 12"
          title="Practice Result"
          description="Instant feedback on your coaching choices."
        />
        <div className="p-8 flex-1 overflow-y-auto space-y-8 max-h-[60vh]">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 border-b border-border/50">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Overall Score</div>
            <div className="text-6xl font-bold text-foreground flex items-baseline">
              <span className={result.score >= 80 ? "text-primary" : "text-foreground"}>{result.score}</span>
              <span className="text-2xl text-muted-foreground ml-2">/100</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-md border border-border/50 bg-secondary/20">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Evaluated Skill</div>
              <div className="text-lg font-medium text-foreground">{result.skill}</div>
            </div>
            <div className="p-5 rounded-md border border-border/50 bg-secondary/20">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Observation</div>
              <div className="text-base text-foreground leading-relaxed">{result.observation}</div>
            </div>
          </div>
        </div>
        <FooterActions
          onBack={() => {}}
          onNext={() => onNext({
            onboardingData: {
              firstChallenge: {
                sessionId,
                result: response,
                score: result.score,
                completed: true,
                overallScore: result.score
              }
            }
          })}
          isSaving={isSaving}
          nextLabel="Continue"
          hideBack
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 12"
        title="First Practice Challenge"
        description="Immediately apply your skills in a simulated scenario."
      />
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        {error && (
          <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="p-6 rounded-md bg-secondary/30 border border-border/50 space-y-4">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your client says:</div>
          <p className="text-xl italic text-foreground font-serif">“{SCENARIO}”</p>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">Your Response</label>
          <textarea
            autoFocus
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Type exactly what you would say to the client..."
            className="w-full h-32 p-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
          />
        </div>
      </div>
      <FooterActions
        onBack={onBack}
        onNext={handleSubmit}
        isSaving={false}
        nextLabel="Submit Response"
        nextDisabled={!response.trim()}
      />
    </div>
  );
}

export function Step13Plan({ profile, onNext, onBack, isSaving }: StepProps) {
  const [phase, setPhase] = useState<"review" | "customize">("review");
  const [customization, setCustomization] = useState("");

  const PLAN = [
    { section: "Coaching Development", items: ["Questioning practice", "Resistance handling", "Reframing"] },
    { section: "Practice", items: ["3 simulations/week", "1 reflection/week"] },
    { section: "Experience", items: ["Capture 2 experiences/week"] },
    { section: "Methodology", items: ["Develop 1 framework"] },
    { section: "Brand", items: ["Complete positioning"] },
    { section: "IP", items: ["Develop first reusable asset"] }
  ];

  if (phase === "customize") {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
        <StepHeader
          layer="Layer 13"
          title="Customize Your Plan"
          description="Tell the engine how you want to adjust the trajectory."
        />
        <div className="p-6 flex-1">
          <textarea
            autoFocus
            value={customization}
            onChange={e => setCustomization(e.target.value)}
            placeholder="E.g. I want to focus more on brand building..."
            className="w-full h-40 p-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
          />
        </div>
        <FooterActions
          onBack={() => setPhase("review")}
          onNext={() => onNext({
            onboardingData: {
              thirtyDayPlan: {
                sections: {
                  foundation: ["Complete positioning", "Develop first reusable asset"],
                  practice: ["3 simulations/week"],
                  reflection: ["Capture 2 experiences/week"],
                  building: ["Develop 1 framework"]
                },
                accepted: false,
                customization
              }
            }
          })}
          isSaving={isSaving}
          nextLabel="Save Plan"
          nextDisabled={!customization.trim()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 13"
        title="Build Your 30-Day Practice Plan"
        description="Your personalized development path is ready."
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto max-h-[60vh]">
        {PLAN.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h4 className="font-bold text-foreground border-b border-border/50 pb-2">{section.section}</h4>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex gap-4 p-6 border-t border-border/40 bg-background/40">
        <button
          onClick={onBack}
          disabled={isSaving}
          className="h-12 px-6 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-secondary/50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setPhase("customize")}
          disabled={isSaving}
          className="flex-1 h-12 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-secondary/50 transition-colors"
        >
          Customize
        </button>
        <button
          onClick={() => onNext({
            onboardingData: {
              thirtyDayPlan: {
                sections: {
                  foundation: ["Complete positioning", "Develop first reusable asset"],
                  practice: ["3 simulations/week"],
                  reflection: ["Capture 2 experiences/week"],
                  building: ["Develop 1 framework"]
                },
                accepted: true
              }
            }
          })}
          disabled={isSaving}
          className="flex-1 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-bold uppercase tracking-[.1em] hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(201,168,78,0.15)]"
        >
          Accept Plan
        </button>
      </div>
    </div>
  );
}

export function Step14Passport({ profile, onNext, onBack, isSaving }: StepProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 14"
        title="Coach Passport"
        description="Your persistent profile inside the Practice Engine."
      />
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-2">Identity</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{profile.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Niche</span><span className="font-medium text-foreground">{profile.niche}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Level</span><span className="font-medium text-foreground">{profile.experienceLevel}</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-2">Development</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Current skill levels</span><span className="font-medium text-foreground">Assessed</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Strengths</span><span className="font-medium text-foreground">Listening, Empathy</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-2">Experience & Expertise</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Captured experiences</span><span className="font-medium text-foreground">1</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Emerging principles</span><span className="font-medium text-foreground">1</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-2">Methodology & Brand</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Framework candidates</span><span className="font-medium text-foreground">3</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Positioning</span><span className="font-medium text-foreground">Defined</span></div>
            </div>
          </div>

        </div>
      </div>
      <div className="p-6 border-t border-border/40 bg-background/40">
        <button
          onClick={() => onNext({ onboardingData: { passport: { reviewed: true } } })}
          disabled={isSaving}
          className="w-full h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-md text-base font-bold uppercase tracking-[.1em] hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(201,168,78,0.2)]"
        >
          {isSaving ? <span className="animate-spin mr-2">⟳</span> : null}
          Enter Practice Engine
        </button>
      </div>
    </div>
  );
}
