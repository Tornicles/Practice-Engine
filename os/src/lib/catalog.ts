import type { ProgramWeek, SkillKey } from "./types";

export interface PracticeScenario {
  id: string;
  title: string;
  tag: string;
  skill: SkillKey;
  difficulty: number;
  minutes: number;
  prompt: string;
  rubric: string[];
}

export const PRACTICE_CATALOG: PracticeScenario[] = [
  {
    id: "res",
    title: "The Resistant Executive",
    tag: "Challenge",
    skill: "challenge",
    difficulty: 4,
    minutes: 10,
    prompt: "I've heard all of this before. I don't think coaching is going to change anything.",
    rubric: ["Do not argue for coaching", "Name the stall", "Ask who the work is actually for"],
  },
  {
    id: "stuck",
    title: "The Stuck Client",
    tag: "Questioning",
    skill: "questioning",
    difficulty: 3,
    minutes: 8,
    prompt: "I know what I need to do. I just don't understand why you're asking me all these questions.",
    rubric: ["Stay in diagnosis", "One diagnostic pair", "No advice in the first two turns"],
  },
  {
    id: "buy",
    title: "The Skeptical Buyer",
    tag: "Listening",
    skill: "listening",
    difficulty: 3,
    minutes: 8,
    prompt: "Explain why your methodology is worth this price. We've tried coaches.",
    rubric: ["Do not pitch the method", "Mirror the failed prior attempt", "Surface the real buying fear"],
  },
  {
    id: "silence",
    title: "The Silent Room",
    tag: "Listening",
    skill: "listening",
    difficulty: 4,
    minutes: 8,
    prompt: "… (the client goes quiet for twenty seconds after you ask who owns the decision.)",
    rubric: ["Do not fill the silence", "Reflect the quiet as data", "Ask one question after, not three"],
  },
  {
    id: "advice",
    title: "The Advice Trap",
    tag: "Reframing",
    skill: "reframing",
    difficulty: 3,
    minutes: 8,
    prompt: "Just tell me what you would do. I don't have time for a process.",
    rubric: ["Refuse to become the expert", "Reframe speed as cost of a reverse", "Offer a 48-hour test, not a plan"],
  },
  {
    id: "board",
    title: "The Hidden Audience",
    tag: "Questioning",
    skill: "questioning",
    difficulty: 4,
    minutes: 10,
    prompt: "The team is the problem. If they would just execute, we wouldn't be here.",
    rubric: ["Who is the real audience?", "Separate team from board", "Client names the hidden client"],
  },
  {
    id: "early",
    title: "Challenge Too Early",
    tag: "Challenge",
    skill: "challenge",
    difficulty: 5,
    minutes: 10,
    prompt: "Fine. You're right. I'll do it your way. Can we move on?",
    rubric: ["Do not accept collapse as commitment", "Check ownership", "Time the challenge after trust"],
  },
  {
    id: "reframe",
    title: "The Late Reframe",
    tag: "Reframing",
    skill: "reframing",
    difficulty: 3,
    minutes: 8,
    prompt: "So the issue is motivation. I just need to push harder this quarter.",
    rubric: ["Motivation vs ownership", "Reframe after they own the problem", "One sentence reframe, then stop"],
  },
];

export const DEFAULT_PROGRAM: ProgramWeek[] = [
  { week: 1, title: "Ownership", activity: "Name who the decision is actually for.", skill: "questioning" },
  { week: 2, title: "Diagnosis", activity: "Run one diagnostic pair before any advice.", skill: "listening" },
  { week: 3, title: "The hidden audience", activity: "Write the real audience in one sentence before the next offer.", skill: "questioning" },
  { week: 4, title: "Timed challenge", activity: "Challenge only after they own the problem.", skill: "challenge" },
  { week: 5, title: "Decision rule", activity: "Install a 48-hour rule on one live decision.", skill: "reframing" },
  { week: 6, title: "Silence as data", activity: "Do not fill the quiet in one meeting.", skill: "listening" },
  { week: 7, title: "Advice trap", activity: "Refuse one request to just tell me what to do.", skill: "reframing" },
  { week: 8, title: "Transfer", activity: "Run the protocol once without the coach in the room.", skill: "challenge" },
];
