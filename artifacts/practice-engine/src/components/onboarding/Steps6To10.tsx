import React, { useState } from "react";
import { StepProps, MultiSelectCard, StepHeader, FooterActions } from "./Shared";
import { useCreateExperience } from "@workspace/api-client-react";

export function Step6Development({ profile, onNext, onBack, isSaving }: StepProps) {
  const [modes, setModes] = useState<string[]>(
    profile.onboardingData?.development?.modes || []
  );
  const [minutesPerWeek, setMinutesPerWeek] = useState<string>(
    profile.onboardingData?.development?.minutesPerWeek?.toString() || ""
  );

  const MODES = [
    "Daily guided development", "Short lessons", "Deep learning",
    "Scenario simulations", "Real-client reflection", "Coaching challenges",
    "Assessments", "Framework building", "Content creation", "Course creation"
  ];

  const toggle = (opt: string) => {
    setModes(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 06"
        title="How Do You Want to Develop?"
        description="Choose your preferred development modes."
      />
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map(opt => (
            <MultiSelectCard
              key={opt}
              title={opt}
              selected={modes.includes(opt)}
              onClick={() => toggle(opt)}
            />
          ))}
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold uppercase tracking-[.08em] text-foreground">How much time can you realistically dedicate each day?</label>
          <select
            value={minutesPerWeek}
            onChange={e => setMinutesPerWeek(e.target.value)}
            className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
          >
            <option value="" disabled>Select...</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60+ minutes</option>
          </select>
        </div>
      </div>
      <FooterActions
        onBack={onBack}
        onNext={() => onNext({
          onboardingData: { development: { modes, minutesPerWeek: parseInt(minutesPerWeek) } }
        })}
        isSaving={isSaving}
        nextDisabled={modes.length === 0 || !minutesPerWeek}
      />
    </div>
  );
}

export function Step7Brand({ profile, onNext, onBack, isSaving }: StepProps) {
  const [phase, setPhase] = useState<"edit" | "review">("edit");
  const existing = profile.onboardingData?.brand?.discovery || {};

  const [answers, setAnswers] = useState({
    q1: (existing.q1 as string) || "",
    q2: (existing.q2 as string) || "",
    q3: (existing.q3 as string) || "",
    q4: (existing.q4 as string) || "",
    q5: (existing.q5 as string) || "",
    q6: (existing.q6 as string) || "",
  });

  const QUESTIONS = [
    { id: 'q1', text: "What do you want to be known for?" },
    { id: 'q2', text: "Who do you most want to help?" },
    { id: 'q3', text: "What problem do you want to become known for solving?" },
    { id: 'q4', text: "What makes your approach different?" },
    { id: 'q5', text: "What do you believe about coaching that others may not?" },
    { id: 'q6', text: "What experience gives you credibility?" },
  ];

  const allAnswered = Object.values(answers).every(v => v.trim().length > 0);

  if (phase === "review") {
    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
        <StepHeader
          layer="Layer 07"
          title="Brand Core Proposal"
          description="Based on your answers, here is your initial Brand Core."
        />
        <div className="p-8 flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg p-8 rounded-lg bg-primary/5 border border-primary/20 shadow-[0_0_30px_rgba(201,168,78,0.05)] space-y-6">
            <div className="engine-kicker text-primary text-center mb-4">Initial Brand Core</div>
            <p className="text-lg leading-relaxed text-foreground font-medium text-center">
              For <span className="text-primary">{answers.q2 || "your audience"}</span> who struggle with <span className="text-primary">{answers.q3 || "a problem"}</span>,
              I provide a different approach through <span className="text-primary">{answers.q4 || "your unique method"}</span>.
            </p>
            <p className="text-base text-muted-foreground text-center">
              I believe <span className="text-foreground">{answers.q5}</span>, and I am known for <span className="text-foreground">{answers.q1}</span>.
            </p>
          </div>
        </div>
        <div className="flex gap-4 p-6 border-t border-border/40 bg-background/40">
          <button
            onClick={() => setPhase("edit")}
            className="flex-1 h-12 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-secondary/50 transition-colors"
          >
            Edit Inputs
          </button>
          <button
            onClick={() => onNext({ onboardingData: { brand: { discovery: answers, reviewState: 'accepted' } } })}
            disabled={isSaving}
            className="flex-1 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-bold uppercase tracking-[.1em] hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(201,168,78,0.15)]"
          >
            {isSaving ? <span className="animate-spin">...</span> : "Accept Brand Core"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 07"
        title="Brand Discovery"
        description="Create your initial Brand Core."
      />
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        {QUESTIONS.map(q => (
          <div key={q.id} className="space-y-3">
            <label className="text-sm font-semibold text-foreground">{q.text}</label>
            <textarea
              value={(answers as any)[q.id]}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              className="w-full h-24 p-3 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
            />
          </div>
        ))}
      </div>
      <FooterActions
        onBack={onBack}
        onNext={() => setPhase("review")}
        isSaving={false}
        nextLabel="Generate Brand Core"
        nextDisabled={!allAnswered}
      />
    </div>
  );
}

export function Step8Methodology({ profile, onNext, onBack, isSaving }: StepProps) {
  const [phase, setPhase] = useState<"edit" | "analyzing" | "review">("edit");
  const [candidates, setCandidates] = useState<Array<{title: string, description: string, status: 'keep' | 'edit' | 'discard'}>>([]);
  const existing = profile.onboardingData?.methodology?.discovery || {};

  const [answers, setAnswers] = useState({
    q1: (existing.q1 as string) || "",
    q2: (existing.q2 as string) || "",
    q3: (existing.q3 as string) || "",
    q4: (existing.q4 as string) || "",
    q5: (existing.q5 as string) || "",
    q6: (existing.q6 as string) || "",
  });

  const QUESTIONS = [
    { id: 'q1', text: "When someone comes to you with a problem, what do you usually do first?" },
    { id: 'q2', text: "What do you look for?" },
    { id: 'q3', text: "What questions do you repeatedly ask?" },
    { id: 'q4', text: "What principles guide your coaching?" },
    { id: 'q5', text: "What approaches have worked particularly well?" },
    { id: 'q6', text: "What approaches have failed?" },
  ];

  const allAnswered = Object.values(answers).every(v => v.trim().length > 0);

  const startAnalysis = () => {
    setPhase("analyzing");
    // Generate deterministic candidates based on actual answers instead of random fake timeout
    const derivedCandidates = [
      {
        title: answers.q4 ? "Core Principle Driver" : "Action-Oriented Inquiry",
        description: answers.q4 ? `Grounded in your belief: "${answers.q4.substring(0, 50)}..."` : "Focuses on moving clients toward immediate action.",
        status: 'keep' as const
      },
      {
        title: answers.q1 ? "Initial Alignment Sequence" : "Pattern Recognition Model",
        description: answers.q1 ? `Based on your first step: "${answers.q1.substring(0, 50)}..."` : "Identifying repeating behaviors in client stories.",
        status: 'keep' as const
      },
      {
        title: "Anti-Pattern Navigation",
        description: answers.q6 ? `Avoiding the trap of: "${answers.q6.substring(0, 50)}..."` : "What not to do when a client is stuck.",
        status: 'keep' as const
      }
    ];

    setCandidates(derivedCandidates);
    setPhase("review");
  };

  const updateCandidateStatus = (index: number, status: 'keep' | 'edit' | 'discard') => {
    setCandidates(prev => {
      const next = [...prev];
      next[index].status = status;
      return next;
    });
  };

  if (phase === "analyzing") {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Extracting Methodology</h3>
        <p className="text-muted-foreground text-sm">Identifying patterns, principles, and processes in your experience...</p>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
        <StepHeader
          layer="Layer 08"
          title="Methodology Candidates"
          description="We derived 3 potential frameworks from your actual answers."
        />
        <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[60vh]">
          {candidates.map((c, i) => (
            <div key={i} className={`p-5 rounded-md border space-y-3 transition-colors ${
              c.status === 'discard' ? 'opacity-50 bg-background border-border' :
              c.status === 'edit' ? 'bg-secondary/30 border-secondary' :
              'border-primary/30 bg-primary/5'
            }`}>
              <h4 className="font-bold text-foreground text-lg">{c.title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{c.description}</p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => updateCandidateStatus(i, 'keep')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${c.status === 'keep' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                >Keep</button>
                <button
                  onClick={() => updateCandidateStatus(i, 'edit')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${c.status === 'edit' ? 'bg-secondary text-foreground' : 'bg-transparent border border-border text-muted-foreground hover:bg-secondary/50'}`}
                >Edit</button>
                <button
                  onClick={() => updateCandidateStatus(i, 'discard')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${c.status === 'discard' ? 'bg-destructive/20 text-destructive' : 'bg-transparent border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'}`}
                >Discard</button>
              </div>
            </div>
          ))}
        </div>
        <FooterActions
          onBack={() => setPhase("edit")}
          onNext={() => onNext({
            onboardingData: {
              methodology: {
                discovery: answers,
                candidates: candidates.filter(c => c.status !== 'discard').map(c => ({ title: c.title, description: c.description })),
                reviewState: 'keep'
              }
            }
          })}
          isSaving={isSaving}
          nextLabel="Save Candidates"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 08"
        title="Methodology Discovery"
        description="Discover how you actually coach."
      />
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        {QUESTIONS.map(q => (
          <div key={q.id} className="space-y-3">
            <label className="text-sm font-semibold text-foreground">{q.text}</label>
            <textarea
              value={(answers as any)[q.id]}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              className="w-full h-20 p-3 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
            />
          </div>
        ))}
      </div>
      <FooterActions
        onBack={onBack}
        onNext={startAnalysis}
        isSaving={false}
        nextLabel="Analyze Methodology"
        nextDisabled={!allAnswered}
      />
    </div>
  );
}

export function Step9Build({ profile, onNext, onBack, isSaving }: StepProps) {
  const [ambitions, setAmbitions] = useState<string[]>(
    profile.onboardingData?.build?.ambitions || []
  );
  const [firstBuild, setFirstBuild] = useState<string>(
    profile.onboardingData?.build?.firstBuild?.type || ""
  );

  const OPTIONS = [
    "Content", "Frameworks", "Workshops", "Courses",
    "Masterclasses", "Assessments", "Coaching programs",
    "Digital products", "Books", "Training for other coaches",
    "Lead magnets", "Other"
  ];

  const toggle = (opt: string) => {
    setAmbitions(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 09"
        title="What Do You Want to Build?"
        description="Determine your IP and product ambitions."
      />
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {OPTIONS.map(opt => (
            <MultiSelectCard
              key={opt}
              title={opt}
              selected={ambitions.includes(opt)}
              onClick={() => toggle(opt)}
            />
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <label className="text-sm font-bold uppercase tracking-[.08em] text-foreground">What is the first thing you would most like to build?</label>
          <select
            value={firstBuild}
            onChange={e => setFirstBuild(e.target.value)}
            className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
          >
            <option value="" disabled>Select...</option>
            <option value="Course">Course</option>
            <option value="Framework">Framework</option>
            <option value="Content">Content</option>
            <option value="Product">Digital Product</option>
          </select>
        </div>
      </div>
      <FooterActions
        onBack={onBack}
        onNext={() => onNext({
          onboardingData: { build: { ambitions, firstBuild: { type: firstBuild, title: "", description: "" } } }
        })}
        isSaving={isSaving}
        nextDisabled={ambitions.length === 0 || !firstBuild}
      />
    </div>
  );
}

export function Step10FirstExperience({ profile, onNext, onBack, isSaving }: StepProps) {
  const [qIndex, setQIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const createExp = useCreateExperience();
  const [saveError, setSaveError] = useState<string | null>(null);

  const existing = profile.onboardingData?.firstExperience || {};
  const [answers, setAnswers] = useState<Record<string, string>>({
    whatHappened: existing.whatHappened || "",
    whoWasInvolved: existing.whoWasInvolved || "",
    whatDidYouDo: existing.whatDidYouDo || "",
    whatWereYouThinking: existing.whatWereYouThinking || "",
    whatWorked: existing.whatWorked || "",
    whatDidNotWork: existing.whatDidNotWork || "",
    whatDidYouLearn: existing.whatDidYouLearn || "",
    whatWillYouDoDifferently: existing.whatWillYouDoDifferently || "",
  });

  const QUESTIONS = [
    { id: 'whatHappened', text: "Tell us about one coaching experience that changed the way you think about coaching." },
    { id: 'whoWasInvolved', text: "Who was involved in this situation?" },
    { id: 'whatWereYouThinking', text: "What did you initially think was going on?" },
    { id: 'whatDidYouDo', text: "What did you actually do?" },
    { id: 'whatWorked', text: "What worked well?" },
    { id: 'whatDidNotWork', text: "What did not work or happened unexpectedly?" },
    { id: 'whatDidYouLearn', text: "What did this experience teach you?" },
    { id: 'whatWillYouDoDifferently', text: "What will you do differently next time?" },
  ];

  const currentQ = QUESTIONS[qIndex];
  const progress = ((qIndex + 1) / QUESTIONS.length) * 100;

  const handleNext = async () => {
    setSaveError(null);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setIsCreating(true);
      let expId = undefined;
      try {
        const res = await createExp.mutateAsync({
          data: {
            clientRequestId: `${profile.id}-onboarding-first-experience`,
            title: answers.whatHappened ? answers.whatHappened.substring(0, 100) : "First Experience",
            situation: answers.whoWasInvolved || "Context",
            learning: answers.whatDidYouLearn || "Lesson learned",
            principle: answers.whatWillYouDoDifferently || "Core principle"
          }
        });
        expId = res.id;
      } catch (e: any) {
        setSaveError(e.message || "Failed to save experience. Please try again.");
        setIsCreating(false);
        return;
      }

      onNext({
        onboardingData: {
          firstExperience: {
            experienceId: expId,
            captureState: 'saved',
            ...answers
          }
        }
      });
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else onBack();
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <StepHeader
        layer="Layer 10"
        title="First Experience Capture"
        description="Experience → Expertise → IP"
      />
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="p-8 flex-1 flex flex-col justify-center min-h-[300px]">
        {saveError && (
          <div className="p-3 mb-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
            {saveError}
          </div>
        )}
        <div key={qIndex} className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-2">Question {qIndex + 1} of {QUESTIONS.length}</div>
          <h3 className="text-2xl font-medium text-foreground leading-tight">{currentQ.text}</h3>
          <textarea
            autoFocus
            value={answers[currentQ.id]}
            onChange={e => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
            placeholder="Type your reflection here..."
            className="w-full h-40 p-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
          />
        </div>
      </div>
      <FooterActions
        onBack={handleBack}
        onNext={handleNext}
        isSaving={isSaving || isCreating}
        nextDisabled={!answers[currentQ.id]?.trim()}
        nextLabel={qIndex === QUESTIONS.length - 1 ? "Save Experience" : "Continue"}
      />
    </div>
  );
}
