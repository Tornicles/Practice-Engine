import React, { useState } from "react";
import { StepProps, MultiSelectCard, StepHeader, FooterActions } from "./Shared";
import { useCreatePracticeSession } from "@workspace/api-client-react";

export function Step1Welcome({ onNext, isSaving }: StepProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 p-8 pb-12 text-center space-y-6 flex flex-col justify-center min-h-[400px]">
        <div className="inline-flex mx-auto h-12 w-12 items-center justify-center border border-primary/40 bg-primary/10 text-primary rounded-sm shadow-[0_0_15px_rgba(201,168,78,0.15)] mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div className="engine-kicker text-primary tracking-[.2em]">Initialization Sequence</div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Build Your Coaching Practice</h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
          Become a better coach. Improve your delivery. Build your methodology. Build your brand. Turn your experience into expertise, IP, courses, and products.
        </p>
      </div>
      <FooterActions
        onBack={() => {}}
        onNext={() => onNext({})}
        isSaving={isSaving}
        nextLabel="Get Started"
        hideBack
      />
    </div>
  );
}

export function Step2Goals({ profile, onNext, onBack, isSaving }: StepProps) {
  const [selected, setSelected] = useState<string[]>(
    profile.onboardingData?.goals?.outcomes || []
  );

  const OPTIONS = [
    "Become a better coach",
    "Improve my coaching delivery",
    "Practice difficult situations",
    "Build my coaching brand",
    "Develop my own methodology",
    "Turn my experience into IP",
    "Create courses",
    "Create content",
    "Build coaching products",
    "Grow my coaching business"
  ];

  const toggle = (opt: string) => {
    setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 02"
        title="What Do You Want to Accomplish?"
        description="Select all that apply. The engine will tailor your development path."
      />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[50vh]">
        {OPTIONS.map(opt => (
          <MultiSelectCard
            key={opt}
            title={opt}
            selected={selected.includes(opt)}
            onClick={() => toggle(opt)}
          />
        ))}
      </div>
      <FooterActions
        onBack={onBack}
        onNext={() => onNext({ onboardingData: { goals: { outcomes: selected } } })}
        isSaving={isSaving}
        nextDisabled={selected.length === 0}
      />
    </div>
  );
}

export function Step3Profile({ profile, onNext, onBack, isSaving }: StepProps) {
  const [name, setName] = useState(profile.name || "");
  const [niche, setNiche] = useState(profile.niche || "");
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || "");
  const [audience, setAudience] = useState(profile.audience || "");
  const [yearsCoaching, setYearsCoaching] = useState(profile.onboardingData?.profileDetails?.yearsCoaching?.toString() || "");
  const [coachingTypes, setCoachingTypes] = useState<string[]>(profile.onboardingData?.profileDetails?.coachingTypes || []);

  const TYPES = ["1:1", "Group", "Executive", "Business", "Career", "Leadership", "Performance", "Life", "Other"];

  const toggleType = (t: string) => {
    setCoachingTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 03"
        title="Coach Profile"
        description="Establish your basic identity and professional context."
      />
      <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[60vh]">
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[.08em] text-muted-foreground font-semibold">Your Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[.08em] text-muted-foreground font-semibold">What is your coaching niche?</label>
          <input
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="Example: Executive Coaching, Career Coaching"
            className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-[.08em] text-muted-foreground font-semibold">How long have you been coaching?</label>
            <select
              value={yearsCoaching}
              onChange={e => setYearsCoaching(e.target.value)}
              className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
            >
              <option value="" disabled>Select...</option>
              <option value="0">Not yet coaching</option>
              <option value="1">Less than 1 year</option>
              <option value="3">1-3 years</option>
              <option value="5">3-5 years</option>
              <option value="10">5-10 years</option>
              <option value="15">10+ years</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-[.08em] text-muted-foreground font-semibold">Where are you currently?</label>
            <select
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}
              className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
            >
              <option value="" disabled>Select...</option>
              <option value="Exploring coaching">Exploring coaching</option>
              <option value="Starting out">Starting out</option>
              <option value="Developing">Developing</option>
              <option value="Experienced">Experienced</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[.08em] text-muted-foreground font-semibold">Who do you currently coach?</label>
          <input
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="Example: Series B Founders, Career Pivoters"
            className="w-full h-12 px-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[.08em] text-muted-foreground font-semibold">What type of coaching do you provide?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPES.map(t => (
              <MultiSelectCard key={t} title={t} selected={coachingTypes.includes(t)} onClick={() => toggleType(t)} className="p-3" />
            ))}
          </div>
        </div>
      </div>
      <FooterActions
        onBack={onBack}
        onNext={() => onNext({
          name, niche, audience, experienceLevel,
          onboardingData: {
            profileDetails: { yearsCoaching: yearsCoaching ? parseInt(yearsCoaching) : 0, coachingTypes, currentStage: experienceLevel }
          }
        })}
        isSaving={isSaving}
        nextDisabled={!name || !niche || !audience || !yearsCoaching || !experienceLevel || coachingTypes.length === 0}
      />
    </div>
  );
}

export function Step4Experience({ profile, onNext, onBack, isSaving }: StepProps) {
  const [qIndex, setQIndex] = useState(0);
  const existing = profile.onboardingData?.experienceDiscovery || {};
  const [answers, setAnswers] = useState({
    q1: (existing.q1 as string) || "",
    q2: (existing.q2 as string) || "",
    q3: (existing.q3 as string) || "",
    q4: (existing.q4 as string) || "",
  });

  const questions = [
    { id: 'q1' as const, text: "What problems have you repeatedly helped people solve?" },
    { id: 'q2' as const, text: "What types of situations have you coached people through?" },
    { id: 'q3' as const, text: "What are you particularly good at helping people with?" },
    { id: 'q4' as const, text: "What coaching situations have taught you the most?" },
  ];

  const currentQ = questions[qIndex];
  const progress = ((qIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      onNext({
        onboardingData: {
          experienceDiscovery: { ...existing, ...answers }
        }
      });
    }
  };

  const handleBack = () => {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else onBack();
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <StepHeader
        layer="Layer 04"
        title="Your Coaching Experience"
        description="Discover the experience that will become your knowledge."
      />
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="p-8 flex-1 flex flex-col justify-center min-h-[300px]">
        <div key={qIndex} className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
          <h3 className="text-xl font-medium text-foreground">{currentQ.text}</h3>
          <textarea
            autoFocus
            value={answers[currentQ.id]}
            onChange={e => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
            placeholder="Type your answer here..."
            className="w-full h-40 p-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
          />
        </div>
      </div>
      <FooterActions
        onBack={handleBack}
        onNext={handleNext}
        isSaving={isSaving}
        nextDisabled={!answers[currentQ.id]?.trim()}
      />
    </div>
  );
}

export function Step5Assessment({ profile, onNext, onBack, isSaving }: StepProps) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    profile.onboardingData?.skillRatings || {}
  );
  const [scenarioChoice, setScenarioChoice] = useState(
    profile.onboardingData?.miniScenario?.choice || ""
  );
  const [practiceText, setPracticeText] = useState("");

  const saveSession = useCreatePracticeSession();

  const SKILLS = [
    { id: 'listening', label: 'Listening' },
    { id: 'questioning', label: 'Questioning' },
    { id: 'reframing', label: 'Reframing' },
    { id: 'challenging', label: 'Challenging' },
    { id: 'accountability', label: 'Accountability' },
    { id: 'sessionStructure', label: 'Session structure' },
    { id: 'handlingResistance', label: 'Handling resistance' },
    { id: 'interventionSelection', label: 'Intervention selection' },
    { id: 'coachingJudgment', label: 'Coaching judgment' },
  ];

  const SCENARIO_OPTIONS = [
    { text: "Why do you think nothing will change?", score: 50, eval: "A bit defensive, puts burden on client." },
    { text: "What have you actually tried so far?", score: 40, eval: "Can sound interrogative under resistance." },
    { text: "It sounds like you're feeling incredibly stuck right now.", score: 90, eval: "Strong empathy, diffuses resistance." },
    { text: "If nothing is going to change, why are we talking today?", score: 70, eval: "Strong challenge, risky but effective." },
  ];

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleNext = async () => {
    setSaveError(null);
    let sessionId = undefined;
    if (practiceText.trim()) {
      try {
        const res = await saveSession.mutateAsync({
          data: {
            scenario: "Initial Onboarding Assessment",
            category: "Assessment",
            score: 0,
            feedback: "Self-assessed initial practice",
            clientRequestId: `${profile.id}-onboarding-assessment`
          }
        });
        sessionId = res.id;
      } catch (e: any) {
        setSaveError(e.message || "Failed to save practice session. Please try again.");
        return;
      }
    }

    const choiceObj = SCENARIO_OPTIONS.find(o => o.text === scenarioChoice);

    onNext({
      onboardingData: {
        skillRatings: ratings,
        miniScenario: {
          choice: scenarioChoice,
          evaluation: choiceObj?.eval || "",
          score: choiceObj?.score || 0
        },
        practice: practiceText.trim() ? { sessionId, result: practiceText } : undefined
      }
    });
  };

  const allRated = SKILLS.every(s => ratings[s.id]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      <StepHeader
        layer="Layer 05"
        title="Coaching Skills Assessment"
        description="Establish your starting skill baseline."
      />
      <div className="p-6 space-y-12 flex-1 overflow-y-auto max-h-[65vh]">
        {saveError && (
          <div className="p-3 mb-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
            {saveError}
          </div>
        )}

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold border-b border-border/50 pb-2">Part A — Quick Self-Assessment</h3>
            <p className="text-sm text-muted-foreground">Rate your confidence from 1 (Low) to 5 (High).</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {SKILLS.map(skill => (
              <div key={skill.id} className="space-y-3">
                <label className="text-sm font-medium">{skill.label}</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button
                      key={v}
                      onClick={() => setRatings({ ...ratings, [skill.id]: v })}
                      className={`flex-1 h-10 rounded-md border font-mono text-sm transition-all ${
                        ratings[skill.id] === v
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold border-b border-border/50 pb-2">Part B — Mini Scenario</h3>
          </div>
          <div className="p-5 rounded-md bg-secondary/30 border border-border/50 space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Client says:</div>
            <p className="text-lg italic text-foreground font-serif">“I've already tried everything. Nothing is going to change.”</p>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Choose your response:</label>
            <div className="space-y-2">
              {SCENARIO_OPTIONS.map(opt => (
                <div
                  key={opt.text}
                  onClick={() => setScenarioChoice(opt.text)}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    scenarioChoice === opt.text
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/50 bg-background hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  {opt.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold border-b border-border/50 pb-2">Part C — Optional Practice</h3>
            <p className="text-sm text-muted-foreground">Type a custom response to the client above.</p>
          </div>
          <textarea
            value={practiceText}
            onChange={e => setPracticeText(e.target.value)}
            placeholder="Your live simulation response... (Optional)"
            className="w-full h-24 p-4 rounded-md border border-input bg-background text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
          />
        </section>

      </div>
      <FooterActions
        onBack={onBack}
        onNext={handleNext}
        isSaving={isSaving}
        nextDisabled={!allRated || !scenarioChoice}
      />
    </div>
  );
}
