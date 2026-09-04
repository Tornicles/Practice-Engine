import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Button, Field, Card, State, ScreenTitle } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { MultiSelect, SingleSelect, RatingScale, QuestionStepper, AILoadingState } from './OnboardingUI';
import { StepProps } from './types';
import { buildExperienceDecisionUpdate } from './state';
import {
  useExtractExperienceKnowledge,
  useSimulateClientTurn,
  useCreateExperience,
  useCreatePracticeSession,
  ExperienceExtractionResult,
  SimulationTurnResult
} from '@workspace/api-client-react';

export function Step1Welcome({ onNext, isSaving }: StepProps) {
  const c = useColors();
  return (
    <View style={{ gap: 24, paddingTop: 20 }}>
      <ScreenTitle title="Build Your Coaching Practice" />
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: c.foreground }}>
        Become a better coach. Improve your delivery. Build your methodology. Build your brand. Turn your experience into expertise, IP, courses, and products.
      </Text>
      <Button label="Get Started" onPress={() => onNext({ onboardingStep: 2 })} disabled={isSaving} />
    </View>
  );
}

const GOAL_OPTIONS = [
  'Become a better coach', 'Improve my coaching delivery', 'Practice difficult situations',
  'Build my coaching brand', 'Develop my own methodology', 'Turn my experience into IP',
  'Create courses', 'Create content', 'Build coaching products', 'Grow my coaching business'
];

export function Step2Goals({ profile, onNext, isSaving }: StepProps) {
  const [selected, setSelected] = useState<string[]>(profile.onboardingData?.goals?.outcomes || []);
  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="What do you want to accomplish?" detail="Select all that apply." />
      <MultiSelect options={GOAL_OPTIONS} selected={selected} onChange={setSelected} />
      <Button
        label="Continue"
        onPress={() => onNext({
          onboardingData: { ...profile.onboardingData, goals: { ...profile.onboardingData?.goals, outcomes: selected } },
          onboardingStep: 3
        })}
        disabled={selected.length === 0 || isSaving}
      />
    </View>
  );
}

const EXP_OPTIONS = ['Not yet coaching', 'Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'];
const STAGE_OPTIONS = ['Exploring coaching', 'Starting out', 'Developing', 'Experienced', 'Advanced', 'Expert'];
const COACHING_TYPES = ['1:1', 'Group', 'Executive', 'Business', 'Career', 'Leadership', 'Performance', 'Life', 'Other'];

export function Step3Profile({ profile, onNext, isSaving }: StepProps) {
  const c = useColors();
  const [name, setName] = useState(profile.name || '');
  const [niche, setNiche] = useState(profile.niche || '');
  const [exp, setExp] = useState(profile.experienceLevel || '');
  const [stage, setStage] = useState(profile.onboardingData?.profileDetails?.currentStage || '');
  const [audience, setAudience] = useState(profile.audience || '');
  const [types, setTypes] = useState<string[]>(profile.onboardingData?.profileDetails?.coachingTypes || []);

  const isValid = name && niche && exp && stage && audience && types.length > 0;

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="Coach Profile" detail="Establish your professional identity." />

      <Field label="1. Your Name" value={name} onChangeText={setName} placeholder="Enter your name" />
      <Field label="2. What is your coaching niche?" value={niche} onChangeText={setNiche} placeholder="Example: Executive Coaching" />

      <View style={{ gap: 12 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground }}>3. How long have you been coaching?</Text>
        <SingleSelect options={EXP_OPTIONS} selected={exp} onChange={setExp} />
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground }}>4. Where are you currently?</Text>
        <SingleSelect options={STAGE_OPTIONS} selected={stage} onChange={setStage} />
      </View>

      <Field label="5. Who do you currently coach?" value={audience} onChangeText={setAudience} placeholder="Example: First-time managers" />

      <View style={{ gap: 12 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground }}>6. What type of coaching do you provide?</Text>
        <MultiSelect options={COACHING_TYPES} selected={types} onChange={setTypes} />
      </View>

      <Button label="Continue" disabled={!isValid || isSaving} onPress={() => {
        let years = 0;
        if (exp === 'Less than 1 year') years = 0.5;
        if (exp === '1–3 years') years = 2;
        if (exp === '3–5 years') years = 4;
        if (exp === '5–10 years') years = 7;
        if (exp === '10+ years') years = 10;

        onNext({
          name, niche, experienceLevel: exp, audience,
          onboardingData: {
            ...profile.onboardingData,
            profileDetails: {
              ...profile.onboardingData?.profileDetails,
              yearsCoaching: years,
              currentStage: stage,
              coachingTypes: types
            }
          },
          onboardingStep: 4
        });
      }} />
    </View>
  );
}

const Q4 = [
  "What problems have you repeatedly helped people solve?",
  "What types of situations have you coached people through?",
  "What are you particularly good at helping people with?",
  "What coaching situations have taught you the most?"
];

export function Step4Experience({ profile, onNext, isSaving }: StepProps) {
  const initial = [
    profile.onboardingData?.experienceDiscovery?.q1 as string || '',
    profile.onboardingData?.experienceDiscovery?.q2 as string || '',
    profile.onboardingData?.experienceDiscovery?.q3 as string || '',
    profile.onboardingData?.experienceDiscovery?.q4 as string || ''
  ];
  return (
    <QuestionStepper
      questions={Q4}
      initialAnswers={initial}
      onComplete={(ans) => onNext({
        onboardingData: {
          ...profile.onboardingData,
          experienceDiscovery: { ...profile.onboardingData?.experienceDiscovery, q1: ans[0], q2: ans[1], q3: ans[2], q4: ans[3] }
        },
        onboardingStep: 5
      })}
      isSaving={isSaving}
    />
  );
}

const SKILLS_MAP = [
  { key: 'listening', label: 'Listening' },
  { key: 'questioning', label: 'Questioning' },
  { key: 'reframing', label: 'Reframing' },
  { key: 'challenging', label: 'Challenging' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'sessionStructure', label: 'Session Structure' },
  { key: 'handlingResistance', label: 'Handling Resistance' },
  { key: 'interventionSelection', label: 'Intervention Selection' },
  { key: 'coachingJudgment', label: 'Coaching Judgment' }
] as const;

export function Step5Skills({ profile, onNext, isSaving }: StepProps) {
  const c = useColors();
  const [phase, setPhase] = useState<'A' | 'B' | 'C'>('A');
  const [ratings, setRatings] = useState<Record<string, number>>(profile.onboardingData?.skillRatings as Record<string, number> || {});
  const [scenarioChoice, setScenarioChoice] = useState<string>(profile.onboardingData?.miniScenario?.choice || '');
  const [practiceResponse, setPracticeResponse] = useState<string>('');

  const simulate = useSimulateClientTurn();
  const createPractice = useCreatePracticeSession();

  const handleSaveAssessment = (practiceSessionId?: number, practiceFeedback?: string) => {
    onNext({
      onboardingData: {
        ...profile.onboardingData,
        skillRatings: ratings as any,
        miniScenario: { choice: scenarioChoice, score: scenarioChoice === "It sounds like you're feeling really frustrated right now." ? 100 : 50 },
        practice: practiceSessionId !== undefined ? { sessionId: practiceSessionId, result: practiceFeedback } : { skipped: true }
      },
      onboardingStep: 6
    });
  };

  if (phase === 'A') {
    return (
      <View style={{ gap: 24 }}>
        <ScreenTitle title="Coaching Skills Assessment" detail="Rate your confidence level in these core coaching skills from 1 (low) to 5 (high)." />
        {SKILLS_MAP.map(s => (
          <RatingScale key={s.key} label={s.label} value={ratings[s.key]} onChange={(val) => setRatings({...ratings, [s.key]: val})} />
        ))}
        <Button label="Continue" onPress={() => setPhase('B')} disabled={Object.keys(ratings).length < SKILLS_MAP.length} />
      </View>
    );
  }

  if (phase === 'B') {
    return (
      <View style={{ gap: 24 }}>
        <ScreenTitle title="Mini Scenario" detail="How would you handle this situation?" />
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Client:</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', color: c.foreground, fontSize: 16 }}>"I've already tried everything. Nothing is going to change."</Text>
        </Card>
        <SingleSelect
          options={[
            "What exactly have you tried?",
            "It sounds like you're feeling really frustrated right now.",
            "If nothing changes, what happens next?"
          ]}
          selected={scenarioChoice}
          onChange={setScenarioChoice}
          fullWidth
        />
        <View style={{ gap: 12 }}>
          <Button label="Submit Answer" onPress={() => setPhase('C')} disabled={!scenarioChoice} />
          <Button label="Back" onPress={() => setPhase('A')} secondary />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="Optional Practice" detail="Take a moment to respond to a live situation." />
      <Card>
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Client:</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', color: c.foreground, fontSize: 16 }}>"I don't have time to do the homework we agreed on."</Text>
      </Card>
      <Field value={practiceResponse} onChangeText={setPracticeResponse} placeholder="Type your response..." multiline />

      <View style={{ gap: 12 }}>
        <Button label={simulate.isPending || createPractice.isPending ? "Evaluating..." : "Complete Assessment"} disabled={isSaving || simulate.isPending || createPractice.isPending} onPress={() => {
          if (practiceResponse.trim()) {
            simulate.mutate({
              data: {
                scenario: "Client claims they have no time for agreed homework.",
                category: "accountability",
                difficulty: "beginner",
                coachMessage: practiceResponse,
                history: [{ role: 'client', content: "I don't have time to do the homework we agreed on." }]
              }
            }, {
              onSuccess: (simResult) => {
                createPractice.mutate({
                  data: {
                    clientRequestId: `${profile.id}-onboarding-assessment`,
                    scenario: "I don't have time to do the homework we agreed on.",
                    category: "accountability",
                    score: simResult.score,
                    feedback: simResult.observation
                  }
                }, {
                  onSuccess: (savedSession) => handleSaveAssessment(savedSession.id, simResult.observation),
                });
              }
            });
          } else {
            handleSaveAssessment();
          }
        }} />
        <Button label="Skip Practice" secondary onPress={() => handleSaveAssessment()} disabled={isSaving || simulate.isPending || createPractice.isPending} />
        <Button label="Back" onPress={() => setPhase('B')} secondary disabled={isSaving || simulate.isPending || createPractice.isPending} />
        {(simulate.error || createPractice.error) && (
          <State error={simulate.error || createPractice.error} />
        )}
      </View>
    </View>
  );
}

const DEV_MODES = ['Daily guided development', 'Short lessons', 'Deep learning', 'Scenario simulations', 'Real-client reflection', 'Coaching challenges', 'Assessments', 'Framework building', 'Content creation', 'Course creation'];
const DEV_TIMES = [
  { label: '10 minutes', value: '10' },
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '60+ minutes', value: '60+' }
];

export function Step6Development({ profile, onNext, isSaving }: StepProps) {
  const c = useColors();
  const [modes, setModes] = useState<string[]>(profile.onboardingData?.development?.modes || []);
  const [time, setTime] = useState<string>(profile.onboardingData?.development?.dailyTimeCommitment || '');

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="How Do You Want to Develop?" detail="Select the modes of learning that work best for you." />
      <MultiSelect options={DEV_MODES} selected={modes} onChange={setModes} />

      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground, marginTop: 16 }}>How much time can you realistically dedicate each day?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {DEV_TIMES.map(opt => (
          <Pressable
            key={opt.value}
            onPress={() => setTime(opt.value)}
            style={[{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1 }, { backgroundColor: time === opt.value ? c.primary : c.card, borderColor: time === opt.value ? c.primary : c.border }]}
          >
            <Text style={{ color: time === opt.value ? c.primaryForeground : c.foreground, fontSize: 14, fontFamily: 'Inter_500Medium' }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button label="Continue" disabled={modes.length === 0 || !time || isSaving} onPress={() => onNext({
        onboardingData: { ...profile.onboardingData, development: { ...profile.onboardingData?.development, modes, dailyTimeCommitment: time as any } },
        onboardingStep: 7
      })} />
    </View>
  );
}

const Q7 = [
  "What do you want to be known for?",
  "Who do you most want to help?",
  "What problem do you want to become known for solving?",
  "What makes your approach different?",
  "What do you believe about coaching that others may not?",
  "What experience gives you credibility?"
];

export function Step7Brand({ profile, onNext, isSaving }: StepProps) {
  const [phase, setPhase] = useState<'questions' | 'review'>('questions');
  const [answers, setAnswers] = useState<string[]>(() => {
    const d = profile.onboardingData?.brand?.discovery;
    return d ? [d.q1, d.q2, d.q3, d.q4, d.q5, d.q6].map(String) : [];
  });
  const c = useColors();

  if (phase === 'questions') {
    return <QuestionStepper questions={Q7} initialAnswers={answers.length === Q7.length ? answers : undefined} onComplete={(ans) => { setAnswers(ans); setPhase('review'); }} isSaving={isSaving} />;
  }

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="Draft Brand Core" detail="Based on your answers, here is a draft starting point for your brand." />
      <Card>
        <Text style={{ fontFamily: 'Inter_400Regular', color: c.foreground, fontSize: 16, lineHeight: 24 }}>
          I help <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{answers[1] || 'professionals'}</Text> who are struggling with <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{answers[2] || 'key challenges'}</Text>. What makes my approach different is <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{answers[3] || 'my unique method'}</Text>. I believe that <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{answers[4] || 'everyone has potential'}</Text>, and my background in <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{answers[5] || 'my industry'}</Text> gives me the perspective to guide them there.
        </Text>
      </Card>
      <View style={{ gap: 12, marginTop: 12 }}>
        <Button label="Accept Brand Core" disabled={isSaving} onPress={() => onNext({
          onboardingStep: 8,
          onboardingData: {
            ...profile.onboardingData,
            brand: {
              ...profile.onboardingData?.brand,
              discovery: { ...profile.onboardingData?.brand?.discovery, q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4], q6: answers[5] },
              reviewState: 'accepted'
            }
          }
        })} />
        <Button label="Edit Answers" secondary disabled={isSaving} onPress={() => setPhase('questions')} />
      </View>
    </View>
  );
}

const Q8 = [
  "When someone comes to you with a problem, what do you usually do first?",
  "What do you look for?",
  "What questions do you repeatedly ask?",
  "What principles guide your coaching?",
  "What approaches have worked particularly well?",
  "What approaches have failed?"
];

export function Step8Methodology({ profile, onNext, isSaving }: StepProps) {
  const [phase, setPhase] = useState<'questions' | 'review'>('questions');
  const [answers, setAnswers] = useState<string[]>(() => {
    const d = profile.onboardingData?.methodology?.discovery;
    return d ? [d.q1, d.q2, d.q3, d.q4, d.q5, d.q6].map(String) : [];
  });
  const c = useColors();

  if (phase === 'questions') {
    return <QuestionStepper questions={Q8} initialAnswers={answers.length === Q8.length ? answers : undefined} onComplete={(ans) => {
      setAnswers(ans);
      setPhase('review');
    }} isSaving={isSaving} />;
  }

  const draftCandidates = [
    { title: "Core Approach", description: answers[0] || "Begin with initial diagnosis" },
    { title: "Guiding Principle", description: answers[3] || "Use question-led exploration" },
    { title: "Proven Method", description: answers[4] || "Focus on pragmatic action" }
  ];

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="Draft Methodology Candidates" detail="We mapped these potential principles from your answers." />
      {draftCandidates.map((cand, i) => (
        <Card key={i}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground }}>{i + 1}. {cand.title}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', color: c.mutedForeground, marginTop: 4 }}>{cand.description}</Text>
        </Card>
      ))}
      <View style={{ gap: 12, marginTop: 12 }}>
        <Button label="Keep Principles" disabled={isSaving} onPress={() => onNext({
          onboardingStep: 9,
          onboardingData: {
            ...profile.onboardingData,
            methodology: {
              ...profile.onboardingData?.methodology,
              discovery: { q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4], q6: answers[5] },
              candidates: draftCandidates,
              reviewState: 'keep'
            }
          }
        })} />
        <Button label="Edit Answers" secondary disabled={isSaving} onPress={() => setPhase('questions')} />
        <Button label="Discard" secondary disabled={isSaving} onPress={() => onNext({
          onboardingStep: 9,
          onboardingData: {
            ...profile.onboardingData,
            methodology: {
              ...profile.onboardingData?.methodology,
              discovery: { q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4], q6: answers[5] },
              candidates: [],
              reviewState: 'discard'
            }
          }
        })} />
      </View>
    </View>
  );
}

const BUILD_OPTIONS = ['Content', 'Frameworks', 'Workshops', 'Courses', 'Masterclasses', 'Assessments', 'Coaching programs', 'Digital products', 'Books', 'Training for other coaches', 'Lead magnets', 'Other'];

export function Step9Build({ profile, onNext, isSaving }: StepProps) {
  const c = useColors();
  const [ambitions, setAmbitions] = useState<string[]>(profile.onboardingData?.build?.ambitions || []);
  const [first, setFirst] = useState<string>(profile.onboardingData?.build?.firstBuild?.type || '');

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="What Do You Want to Build?" detail="Determine your IP and product ambitions." />

      <View style={{ gap: 12 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground }}>Select all that apply:</Text>
        <MultiSelect options={BUILD_OPTIONS} selected={ambitions} onChange={setAmbitions} />
      </View>

      {ambitions.length > 0 && (
        <View style={{ gap: 12, marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground }}>What is the first thing you would most like to build?</Text>
          <SingleSelect options={ambitions} selected={first} onChange={setFirst} />
        </View>
      )}

      <Button label="Continue" disabled={!first || isSaving} onPress={() => onNext({
        onboardingData: { ...profile.onboardingData, build: { ...profile.onboardingData?.build, ambitions, firstBuild: { ...profile.onboardingData?.build?.firstBuild, type: first } } },
        onboardingStep: 10
      })} />
    </View>
  );
}

const Q10 = [
  "What happened?",
  "Who was involved?",
  "What did you do?",
  "What were you thinking?",
  "What worked?",
  "What didn't work?",
  "What did you learn?",
  "What will you do differently?"
];

export function Step10ExperienceCapture({ profile, onNext, isSaving }: StepProps) {
  const initial = [
    profile.onboardingData?.firstExperience?.whatHappened || '',
    profile.onboardingData?.firstExperience?.whoWasInvolved || '',
    profile.onboardingData?.firstExperience?.whatDidYouDo || '',
    profile.onboardingData?.firstExperience?.whatWereYouThinking || '',
    profile.onboardingData?.firstExperience?.whatWorked || '',
    profile.onboardingData?.firstExperience?.whatDidNotWork || '',
    profile.onboardingData?.firstExperience?.whatDidYouLearn || '',
    profile.onboardingData?.firstExperience?.whatWillYouDoDifferently || ''
  ];

  return (
    <QuestionStepper
      questions={Q10}
      initialAnswers={initial}
      onComplete={(ans) => onNext({
        onboardingData: {
          ...profile.onboardingData,
          firstExperience: {
            ...profile.onboardingData?.firstExperience,
            whatHappened: ans[0],
            whoWasInvolved: ans[1],
            whatDidYouDo: ans[2],
            whatWereYouThinking: ans[3],
            whatWorked: ans[4],
            whatDidNotWork: ans[5],
            whatDidYouLearn: ans[6],
            whatWillYouDoDifferently: ans[7]
          }
        },
        onboardingStep: 11
      })}
      isSaving={isSaving}
    />
  );
}

export function Step11Analysis({ profile, onNext, isSaving }: StepProps) {
  const extract = useExtractExperienceKnowledge();
  const createExp = useCreateExperience();
  const c = useColors();
  const [result, setResult] = useState<ExperienceExtractionResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const hasExtracted = useRef(false);
  const clientRequestId = useRef(`${profile.id}-onboarding-first-experience`);

  useEffect(() => {
    if (hasExtracted.current || result) return;
    hasExtracted.current = true;

    const data = profile.onboardingData?.firstExperience || {};
    const title = "First Coaching Experience";
    const situation = String(data.whatHappened || 'Situation');
    const reflection = [data.whatDidYouDo, data.whatWereYouThinking, data.whatWorked, data.whatDidNotWork, data.whatDidYouLearn, data.whatWillYouDoDifferently].filter(Boolean).join(' ');

    extract.mutate({
      data: {
        title,
        situation,
        coachReflection: reflection || 'No reflection provided'
      }
    }, {
      onSuccess: setResult
    });
  }, [profile, extract, result]);

  if (extract.isPending) return <AILoadingState message="Extracting lessons from your experience..." />;
  if (extract.error) return <State error={extract.error} retry={() => { hasExtracted.current = false; extract.reset(); }} />;

  if (result) {
    if (isEditing) {
      return (
        <View style={{ gap: 24 }}>
          <ScreenTitle title="Edit Analysis" detail="Refine the extracted lessons." />
          <Field label="Lesson" value={result.lesson} onChangeText={t => setResult({...result, lesson: t})} placeholder="Your lesson..." multiline />
          <Field label="Principle" value={result.principle} onChangeText={t => setResult({...result, principle: t})} placeholder="Your principle..." multiline />
          <Field label="Framework Candidate" value={result.frameworkCandidate} onChangeText={t => setResult({...result, frameworkCandidate: t})} placeholder="Your framework..." multiline />
          <Button label="Done Editing" onPress={() => setIsEditing(false)} />
        </View>
      );
    }

    return (
      <View style={{ gap: 24 }}>
        <ScreenTitle title="Experience Analysis" detail="Here is what we extracted from your experience." />
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.mutedForeground, fontSize: 12 }}>YOUR EXPERIENCE</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', color: c.foreground, fontSize: 16, marginTop: 4 }}>{result.title}</Text>
        </Card>
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.mutedForeground, fontSize: 12 }}>YOUR LESSON</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', color: c.foreground, fontSize: 16, marginTop: 4 }}>{result.lesson}</Text>
        </Card>
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.mutedForeground, fontSize: 12 }}>POTENTIAL PRINCIPLE</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', color: c.foreground, fontSize: 16, marginTop: 4 }}>{result.principle}</Text>
        </Card>
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.mutedForeground, fontSize: 12 }}>POTENTIAL FRAMEWORK</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', color: c.foreground, fontSize: 16, marginTop: 4 }}>{result.frameworkCandidate}</Text>
        </Card>

        <View style={{ gap: 12, marginTop: 12 }}>
          <Button label={createExp.isPending ? "Saving..." : "Accept"} disabled={isSaving || createExp.isPending} onPress={() => {
            createExp.mutate({
              data: {
                clientRequestId: clientRequestId.current,
                title: result.title,
                situation: profile.onboardingData?.firstExperience?.whatHappened || 'Situation',
                learning: result.lesson,
                principle: result.principle
              }
            }, {
              onSuccess: (savedExp) => onNext({
                onboardingStep: 12,
                 onboardingData: buildExperienceDecisionUpdate(
                   profile.onboardingData,
                   result,
                   savedExp.id,
                   'accepted',
                 ),
              })
            });
          }} />
          <Button label="Edit" secondary disabled={isSaving || createExp.isPending} onPress={() => setIsEditing(true)} />
           <Button label={createExp.isPending ? "Saving..." : "Reject"} secondary disabled={isSaving || createExp.isPending} onPress={() => {
             createExp.mutate({
               data: {
                 clientRequestId: clientRequestId.current,
                 title: result.title,
                 situation: profile.onboardingData?.firstExperience?.whatHappened || 'Situation',
                 learning: result.lesson,
                 principle: result.principle,
               },
             }, {
               onSuccess: (savedExp) => onNext({
                 onboardingStep: 12,
                 onboardingData: buildExperienceDecisionUpdate(
                   profile.onboardingData,
                   result,
                   savedExp.id,
                   'rejected',
                 ),
               }),
             });
           }} />
        </View>
        {createExp.error && <State error={createExp.error} />}
      </View>
    );
  }

  return null;
}

export function Step12FirstChallenge({ profile, onNext, isSaving }: StepProps) {
  const simulate = useSimulateClientTurn();
  const createPractice = useCreatePracticeSession();
  const c = useColors();
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<SimulationTurnResult | null>(null);

  if (result) {
    return (
      <View style={{ gap: 24 }}>
        <ScreenTitle title="Practice Result" detail={`Overall: ${result.score}/100`} />
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.mutedForeground, fontSize: 12 }}>OBSERVATION</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', color: c.foreground, fontSize: 16, marginTop: 4 }}>{result.observation}</Text>
        </Card>
        <Card>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.mutedForeground, fontSize: 12 }}>SKILL ASSESSED</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', color: c.foreground, fontSize: 16, marginTop: 4 }}>{result.skill}</Text>
        </Card>
        <Button label={createPractice.isPending ? "Saving..." : "Continue"} disabled={isSaving || createPractice.isPending} onPress={() => {
          createPractice.mutate({
            data: {
              clientRequestId: `${profile.id}-onboarding-challenge-session`,
              scenario: "Client is resisting questioning.",
              category: result.skill || "handling_resistance",
              score: result.score,
              feedback: result.observation
            }
          }, {
            onSuccess: (savedSession) => onNext({
              onboardingStep: 13,
              onboardingData: { ...profile.onboardingData, firstChallenge: { ...profile.onboardingData?.firstChallenge, sessionId: savedSession.id, score: result.score, result: result.observation, completed: true } }
            })
          });
        }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="First Practice Challenge" detail="Respond to this client situation." />
      <Card>
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Client:</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', color: c.foreground, fontSize: 16 }}>"I know what I need to do. I just don't understand why you're asking me all these questions."</Text>
      </Card>
      <Field
        value={message}
        onChangeText={setMessage}
        placeholder="Type your response..."
        multiline
      />
      <Button label={simulate.isPending ? "Evaluating..." : "Send Response"} disabled={!message.trim() || simulate.isPending || isSaving} onPress={() => {
        simulate.mutate({
          data: {
            scenario: "Client is resisting questioning.",
            category: "handling_resistance",
            difficulty: "beginner",
            coachMessage: message,
            history: [{ role: 'client', content: "I know what I need to do. I just don't understand why you're asking me all these questions." }]
          }
        }, { onSuccess: setResult });
      }} />
      {simulate.error && <State error={simulate.error} />}
    </View>
  );
}

export function Step13Plan({ profile, onNext, isSaving }: StepProps) {
  const c = useColors();
  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="Your 30-Day Practice Plan" detail="Based on your profile, here is your personalized development path." />
      <Card>
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Coaching Development</Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>• Questioning practice</Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>• Resistance handling</Text>
        <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>• Reframing</Text>
      </Card>
      <Card>
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Practice & Experience</Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>• 3 simulations/week</Text>
        <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>• Capture 2 experiences/week</Text>
      </Card>
      <View style={{ gap: 12, marginTop: 12 }}>
        <Button label="Accept Plan" disabled={isSaving} onPress={() => onNext({
          onboardingStep: 14,
          onboardingData: {
            ...profile.onboardingData,
            thirtyDayPlan: {
              ...profile.onboardingData?.thirtyDayPlan,
              accepted: true,
              sections: {
                ...profile.onboardingData?.thirtyDayPlan?.sections,
                foundation: ["Questioning practice", "Resistance handling", "Reframing"],
                practice: ["3 simulations/week"],
                reflection: ["Capture 2 experiences/week"]
              }
            }
          }
        })} />
        <Button label="Customize" secondary disabled={isSaving} onPress={() => onNext({
          onboardingStep: 14,
          onboardingData: {
            ...profile.onboardingData,
            thirtyDayPlan: { ...profile.onboardingData?.thirtyDayPlan, accepted: false }
          }
        })} />
      </View>
    </View>
  );
}

export function Step14Passport({ profile, onNext, isSaving }: StepProps) {
  const c = useColors();
  return (
    <View style={{ gap: 24 }}>
      <ScreenTitle title="Coach Passport" detail="Your persistent profile inside the Practice Engine." />

      <Card>
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Identity</Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>Name: <Text style={{ color: c.foreground }}>{profile.name}</Text></Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>Niche: <Text style={{ color: c.foreground }}>{profile.niche}</Text></Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>Experience: <Text style={{ color: c.foreground }}>{profile.experienceLevel}</Text></Text>
      </Card>

      <Card>
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, marginBottom: 8 }}>Development</Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>Goals: <Text style={{ color: c.foreground }}>{profile.onboardingData?.goals?.outcomes?.join(', ')}</Text></Text>
        <Text style={{ color: c.mutedForeground, marginBottom: 4, fontFamily: 'Inter_400Regular' }}>Time Commitment: <Text style={{ color: c.foreground }}>{profile.onboardingData?.development?.dailyTimeCommitment ? `${profile.onboardingData.development.dailyTimeCommitment} minutes` : profile.onboardingData?.development?.schedule}</Text></Text>
      </Card>

      <Button label="Enter Practice Engine" disabled={isSaving} onPress={() => onNext({
        onboardingStep: 15,
        onboardingCompleted: true,
        onboardingData: {
          ...profile.onboardingData,
          passport: { ...profile.onboardingData?.passport, reviewed: true }
        }
      })} />
    </View>
  );
}
