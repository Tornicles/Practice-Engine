import React, { useState, useEffect, useRef } from "react";
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
    setTimeout(() => {
      setPhase("review");
    }, 2500);
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
    const mockCandidates = [
      { title: "Diagnosis Before Prescription", description: "You naturally seek to understand the root cause before offering solutions." },
      { title: "Outcome-Focused Inquiry", description: "Your questions consistently push clients toward actionable outcomes." },
      { title: "Radical Candor", description: "You are not afraid to challenge clients directly when they are stuck." }
    ];

    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
        <StepHeader 
          layer="Layer 08" 
          title="Methodology Candidates" 
          description="We found 3 potential principles in your experience."
        />
        <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[60vh]">
          {mockCandidates.map((c, i) => (
            <div key={i} className="p-5 rounded-md border border-primary/30 bg-primary/5 space-y-3">
              <h4 className="font-bold text-foreground text-lg">{c.title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{c.description}</p>
              <div className="flex gap-2 pt-2">
                <button className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded hover:bg-primary hover:text-primary-foreground transition-colors">Keep</button>
                <button className="px-3 py-1.5 bg-secondary text-foreground text-xs font-bold uppercase tracking-wider rounded hover:bg-secondary/70 transition-colors">Edit</button>
                <button className="px-3 py-1.5 bg-transparent border border-border text-muted-foreground text-xs font-bold uppercase tracking-wider rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">Discard</button>
              </div>
            </div>
          ))}
        </div>
        <FooterActions 
          onBack={() => setPhase("edit")} 
          onNext={() => onNext({ 
            onboardingData: { methodology: { discovery: answers, candidates: mockCandidates, reviewState: 'keep' } } 
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
  const reqIdRef = useRef(crypto.randomUUID());
  
  const existing = profile.onboardingData?.experienceDiscovery || {};
  const [answers, setAnswers] = useState<Record<string, string>>({
    fe_q1: (existing.fe_q1 as string) || "",
    fe_q2: (existing.fe_q2 as string) || "",
    fe_q3: (existing.fe_q3 as string) || "",
    fe_q4: (existing.fe_q4 as string) || "",
    fe_q5: (existing.fe_q5 as string) || "",
    fe_q6: (existing.fe_q6 as string) || "",
    fe_q7: (existing.fe_q7 as string) || "",
    fe_q8: (existing.fe_q8 as string) || "",
  });

  const QUESTIONS = [
    { id: 'fe_q1', text: "Tell us about one coaching experience that changed the way you think about coaching." },
    { id: 'fe_q2', text: "What was happening?" },
    { id: 'fe_q3', text: "What did you initially think?" },
    { id: 'fe_q4', text: "What did you discover?" },
    { id: 'fe_q5', text: "What did you do?" },
    { id: 'fe_q6', text: "What happened afterward?" },
    { id: 'fe_q7', text: "What did this experience teach you?" },
    { id: 'fe_q8', text: "What could another coach learn from this?" },
  ];

  const currentQ = QUESTIONS[qIndex];
  const progress = ((qIndex + 1) / QUESTIONS.length) * 100;

  const handleNext = async () => {
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setIsCreating(true);
      let expId = undefined;
      try {
        const res = await createExp.mutateAsync({
          data: {
            clientRequestId: reqIdRef.current,
            title: answers.fe_q1 || "First Experience",
            situation: answers.fe_q2 || "Context",
            learning: answers.fe_q7 || "Lesson learned",
            principle: answers.fe_q8 || "Core principle"
          }
        });
        expId = res.id;
      } catch (e) {} // Fail gracefully to allow onboarding to complete

      onNext({
        onboardingData: {
          experienceDiscovery: { ...existing, ...answers },
          firstExperience: { experienceId: expId, captureState: 'saved' }
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
