export type IntelligenceEngine =
  | "simulation"
  | "experience-extraction"
  | "asset-generation"
  | "next-action";

export type StrategySourceClass =
  | "marketing-productivity"
  | "neutral-operations";

export interface StrategyCard {
  id: string;
  family: string;
  sourceClass: StrategySourceClass;
  engines: IntelligenceEngine[];
  signals: string[];
  instruction: string;
}

export interface StrategySelection {
  version: string;
  engine: IntelligenceEngine;
  cards: StrategyCard[];
  strategyIds: string[];
  families: string[];
  sourceClasses: StrategySourceClass[];
  promptContext: string;
}

export const STRATEGY_LIBRARY_VERSION = "2026-09-neutral-v1";

const cards: StrategyCard[] = [
  {
    id: "ops-outcome-definition",
    family: "outcome-design",
    sourceClass: "neutral-operations",
    engines: ["experience-extraction", "asset-generation", "next-action"],
    signals: ["goal", "outcome", "result", "finish", "objective", "deliver"],
    instruction:
      "Define the useful outcome first, then identify the smallest observable completion signal.",
  },
  {
    id: "ops-role-ownership",
    family: "role-clarity",
    sourceClass: "neutral-operations",
    engines: ["simulation", "asset-generation", "next-action"],
    signals: ["owner", "role", "team", "delegate", "responsibility", "leader"],
    instruction:
      "Clarify who owns the next action, who contributes, and where human approval remains required.",
  },
  {
    id: "ops-communication-routing",
    family: "communication",
    sourceClass: "neutral-operations",
    engines: ["simulation", "asset-generation", "next-action"],
    signals: ["communicate", "message", "stakeholder", "approval", "handoff", "meeting"],
    instruction:
      "Route information to the person who can act on it, with context, a clear request, and a response deadline.",
  },
  {
    id: "ops-completed-work-packet",
    family: "decision-quality",
    sourceClass: "neutral-operations",
    engines: ["asset-generation", "next-action"],
    signals: ["decision", "proposal", "approve", "recommend", "option", "problem"],
    instruction:
      "Present decisions as a compact packet: situation, relevant facts, options, recommendation, risks, and requested decision.",
  },
  {
    id: "ops-plan-decomposition",
    family: "execution-planning",
    sourceClass: "neutral-operations",
    engines: ["asset-generation", "next-action"],
    signals: ["plan", "project", "program", "launch", "build", "execute", "sequence"],
    instruction:
      "Translate the outcome into ordered milestones and one immediately executable next action.",
  },
  {
    id: "ops-flow-protection",
    family: "workflow",
    sourceClass: "neutral-operations",
    engines: ["simulation", "next-action"],
    signals: ["blocked", "overwhelmed", "delay", "bottleneck", "busy", "priority"],
    instruction:
      "Reduce avoidable handoffs and work in progress; resolve the constraint that most limits forward movement.",
  },
  {
    id: "ops-trend-measurement",
    family: "measurement",
    sourceClass: "neutral-operations",
    engines: ["experience-extraction", "asset-generation", "next-action"],
    signals: ["measure", "metric", "score", "trend", "progress", "proof", "evidence"],
    instruction:
      "Use a small behavior or outcome measure and interpret its trend with context; never use a metric alone to judge a person's worth.",
  },
  {
    id: "ops-quality-loop",
    family: "quality-improvement",
    sourceClass: "neutral-operations",
    engines: ["simulation", "experience-extraction", "asset-generation", "next-action"],
    signals: ["quality", "review", "improve", "feedback", "correct", "test", "iterate"],
    instruction:
      "Use a humane quality loop: define the standard, observe the work, identify the gap, practice a correction, and recheck.",
  },
  {
    id: "ops-training-loop",
    family: "capability-building",
    sourceClass: "neutral-operations",
    engines: ["simulation", "experience-extraction", "next-action"],
    signals: ["learn", "practice", "skill", "train", "coach", "develop"],
    instruction:
      "Convert a capability gap into a specific practice, feedback signal, and next repetition.",
  },
  {
    id: "ops-evidence-reflection",
    family: "evidence-learning",
    sourceClass: "neutral-operations",
    engines: ["simulation", "experience-extraction", "next-action"],
    signals: ["experience", "reflect", "lesson", "evidence", "observed", "happened"],
    instruction:
      "Separate direct observation, interpretation, reusable lesson, and what still needs validation.",
  },
  {
    id: "mkt-audience-problem-fit",
    family: "audience-insight",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["audience", "client", "customer", "market", "persona", "niche"],
    instruction:
      "Connect the coach's evidenced insight to one audience problem without inventing demand or market facts.",
  },
  {
    id: "mkt-evidence-led-positioning",
    family: "positioning",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["brand", "position", "differentiate", "authority", "message"],
    instruction:
      "Frame positioning around demonstrated strengths, a specific audience, and a validation gap rather than unsupported superiority claims.",
  },
  {
    id: "mkt-content-repurposing",
    family: "content-system",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["content", "post", "article", "video", "newsletter", "repurpose"],
    instruction:
      "Adapt one evidenced idea into the requested format while preserving meaning, voice, and source lineage.",
  },
  {
    id: "mkt-learning-product-design",
    family: "learning-design",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["course", "workshop", "exercise", "curriculum", "training"],
    instruction:
      "Organize learning around an observable capability, guided practice, feedback, and transfer to real work.",
  },
  {
    id: "mkt-offer-packaging",
    family: "offer-design",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["offer", "product", "service", "price", "package", "sell"],
    instruction:
      "Package a clearly bounded outcome, delivery method, assumptions, and validation questions without fabricating demand.",
  },
  {
    id: "mkt-validation-experiment",
    family: "market-validation",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["validate", "experiment", "test", "proof", "feedback", "pilot"],
    instruction:
      "Choose a low-risk test with a defined audience, hypothesis, observable signal, and review decision.",
  },
  {
    id: "mkt-copy-structure",
    family: "copywriting",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation"],
    signals: ["copy", "headline", "landing page", "email", "call to action"],
    instruction:
      "Structure copy around an evidenced audience problem, a specific useful change, supportable reasons to believe, and one clear action.",
  },
  {
    id: "mkt-channel-adaptation",
    family: "channel-strategy",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["social", "linkedin", "newsletter", "podcast", "video", "channel"],
    instruction:
      "Adapt the idea to the audience's channel context without changing the underlying claim or manufacturing engagement evidence.",
  },
  {
    id: "mkt-competitive-learning",
    family: "market-learning",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["competitor", "alternative", "category", "market research"],
    instruction:
      "Use alternatives to frame questions and differentiation hypotheses, never to invent competitor facts or disparage others.",
  },
  {
    id: "mkt-discoverability",
    family: "discoverability",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["seo", "search", "keyword", "discover", "website"],
    instruction:
      "Make useful evidenced content easier to discover by aligning its language and structure with a clearly stated audience question.",
  },
  {
    id: "mkt-acquisition-test",
    family: "acquisition",
    sourceClass: "marketing-productivity",
    engines: ["next-action"],
    signals: ["campaign", "ads", "acquisition", "lead", "reach"],
    instruction:
      "Treat acquisition as a bounded experiment with a budget guardrail, a supportable message, a conversion signal, and a stop decision.",
  },
  {
    id: "mkt-visual-brief",
    family: "visual-communication",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation"],
    signals: ["visual", "graphic", "infographic", "image", "design"],
    instruction:
      "Turn the evidenced idea into a visual brief with audience, message hierarchy, required facts, and accessibility constraints.",
  },
  {
    id: "mkt-pricing-hypothesis",
    family: "pricing",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["price", "pricing", "value", "fee", "package"],
    instruction:
      "Frame pricing as a hypothesis about scope, value, delivery cost, and willingness to pay that requires real validation.",
  },
  {
    id: "mkt-distribution-path",
    family: "distribution",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["distribution", "partner", "referral", "affiliate", "channel"],
    instruction:
      "Choose a consent-based path that reaches the intended audience and define how fit and trust will be evaluated.",
  },
  {
    id: "mkt-sales-conversation",
    family: "sales",
    sourceClass: "marketing-productivity",
    engines: ["simulation", "asset-generation", "next-action"],
    signals: ["sales", "discovery", "objection", "proposal", "close"],
    instruction:
      "Use a transparent, needs-led conversation that tests fit and preserves the prospective client's freedom to decline.",
  },
  {
    id: "mkt-relationship-followup",
    family: "relationship-management",
    sourceClass: "marketing-productivity",
    engines: ["asset-generation", "next-action"],
    signals: ["crm", "follow up", "retention", "relationship", "client journey"],
    instruction:
      "Plan relevant follow-up from known context, with a useful purpose, respectful timing, and an easy way to disengage.",
  },
  {
    id: "prod-priority-focus",
    family: "personal-productivity",
    sourceClass: "marketing-productivity",
    engines: ["simulation", "next-action"],
    signals: ["time", "today", "priority", "focus", "minutes", "next"],
    instruction:
      "Fit one high-value action to the available time and make its stopping condition explicit.",
  },
];

const defaults: Record<IntelligenceEngine, string[]> = {
  simulation: ["ops-training-loop", "ops-quality-loop"],
  "experience-extraction": ["ops-evidence-reflection", "ops-quality-loop"],
  "asset-generation": ["ops-outcome-definition", "mkt-validation-experiment"],
  "next-action": ["ops-plan-decomposition", "prod-priority-focus"],
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function scoreCard(card: StrategyCard, context: string, preferredIds: string[]) {
  const signalScore = card.signals.reduce(
    (score, signal) => score + (context.includes(signal) ? 2 : 0),
    0,
  );
  const preferredScore = preferredIds.includes(card.id) ? 5 : 0;
  return signalScore + preferredScore;
}

export function selectStrategies(input: {
  engine: IntelligenceEngine;
  context: unknown;
  preferredIds?: string[];
  limit?: number;
}): StrategySelection {
  const context = String(JSON.stringify(input.context) ?? "").toLowerCase();
  const preferredIds = unique([
    ...defaults[input.engine],
    ...(input.preferredIds ?? []),
  ]);
  const eligible = cards.filter((card) => card.engines.includes(input.engine));
  const ranked = eligible
    .map((card, index) => ({
      card,
      index,
      score: scoreCard(card, context, preferredIds),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = ranked
    .filter((entry) => entry.score > 0)
    .slice(0, input.limit ?? 4)
    .map((entry) => entry.card);

  for (const id of preferredIds) {
    if (selected.length >= (input.limit ?? 4)) break;
    const card = eligible.find((candidate) => candidate.id === id);
    if (card && !selected.includes(card)) selected.push(card);
  }

  const strategyIds = selected.map((card) => card.id);
  const families = unique(selected.map((card) => card.family));
  const sourceClasses = unique(selected.map((card) => card.sourceClass));
  const promptContext = selected
    .map(
      (card, index) =>
        `${index + 1}. [${card.id} | ${card.family}] ${card.instruction}`,
    )
    .join("\n");

  return {
    version: STRATEGY_LIBRARY_VERSION,
    engine: input.engine,
    cards: selected,
    strategyIds,
    families,
    sourceClasses,
    promptContext,
  };
}

const prohibitedOutputRules = [
  { category: "source-identity", pattern: /scientolog/i },
  { category: "source-identity", pattern: /dianetic/i },
  { category: "source-identity", pattern: /l\.\s*ron\s+hubbard/i },
  { category: "source-identity", pattern: /\bhubbard\b/i },
  { category: "source-identity", pattern: /\bHCO\b/i },
  {
    category: "source-identity",
    pattern: /organi[sz]ation executive course/i,
  },
  { category: "loaded-terminology", pattern: /\borg board\b/i },
  { category: "loaded-terminology", pattern: /ethics condition/i },
  { category: "loaded-terminology", pattern: /suppressive person/i },
  { category: "loaded-terminology", pattern: /potential trouble source/i },
  {
    category: "raw-library-leakage",
    pattern: /prompt\s*(?:number|#)\s*\d+/i,
  },
  {
    category: "source-attribution",
    pattern: /(?:source|prompt)\s+library\s+(?:says|states|teaches)/i,
  },
  {
    category: "strategy-id-leakage",
    pattern: /\b(?:ops|mkt|prod)-[a-z0-9-]+\b/i,
  },
  {
    category: "raw-template-leakage",
    pattern: /<(?:business|persona|usp|challenges)>/i,
  },
  {
    category: "punitive-personnel-action",
    pattern:
      /\b(?:fire|terminate|dismiss|demote|discipline|punish|penalize)\b.{0,35}\b(?:employee|worker|staff|team member|person|people)\b/i,
  },
  {
    category: "punitive-personnel-action",
    pattern:
      /\b(?:terminate|dismiss|demote|discipline|punish|penalize|fire)\s+(?:them|him|her)\b/i,
  },
  {
    category: "punitive-personnel-action",
    pattern:
      /\b(?:remove|eliminate|cut)\b.{0,45}\b(?:lowest[- ]ranked|low[- ]performing|bottom[- ]ranked)\b/i,
  },
  {
    category: "punitive-personnel-action",
    pattern:
      /\b(?:employee|worker|staff|team member|person|people)\b.{0,35}\b(?:fired|terminated|dismissed|demoted|disciplined|punished|penalized)\b/i,
  },
  {
    category: "coercion",
    pattern: /\b(?:coerce|force|threaten|intimidate|manipulate)\b/i,
  },
  {
    category: "coercion",
    pattern: /\bpressure\b.{0,35}\b(?:comply|conform|recruit|join|participate)\b/i,
  },
  {
    category: "coercion",
    pattern:
      /\b(?:mandatory|compulsory|compelled|required participation|enforced conformity)\b/i,
  },
  {
    category: "surveillance",
    pattern:
      /\b(?:spy on|secretly monitor|keystroke monitor|track employees|track staff|employee surveillance|staff surveillance)\b/i,
  },
  {
    category: "surveillance",
    pattern:
      /\b(?:monitor|record|track)\b.{0,35}\b(?:every|all|employee|worker|staff|screen|keystroke|private message)\b/i,
  },
  {
    category: "pressured-recruitment",
    pattern:
      /\b(?:recruit|enlist)\b.{0,45}\b(?:pressure|quota|against their will|without consent)\b/i,
  },
  {
    category: "ideological-compliance",
    pattern:
      /\b(?:ideological|religious)\b.{0,25}\b(?:compliance|loyalty|conformity|test)\b/i,
  },
  {
    category: "discrimination",
    pattern:
      /\b(?:race|religion|sex|gender|disability|age|ethnicity)\b.{0,45}\b(?:hire|fire|promote|demote|pay|exclude)\b/i,
  },
  {
    category: "discrimination",
    pattern:
      /\b(?:pregnan|marital status|national origin|sexual orientation|veteran status)\w*\b.{0,45}\b(?:hire|fire|promote|demote|pay|exclude|applicant)\b/i,
  },
  {
    category: "discrimination",
    pattern:
      /\b(?:hire|fire|promote|demote|pay|exclude|applicant)\b.{0,45}\b(?:pregnan|marital status|national origin|sexual orientation|veteran status)\w*\b/i,
  },
  {
    category: "discrimination",
    pattern:
      /\b(?:hire|fire|promote|demote|pay|exclude)\b.{0,45}\b(?:race|religion|sex|gender|disability|age|ethnicity)\b/i,
  },
  {
    category: "dehumanizing-metrics",
    pattern:
      /\b(?:low|down)\s+(?:statistic|metric)\b.{0,60}\b(?:punish|discipline|fire|penalize)\b/i,
  },
  {
    category: "dehumanizing-metrics",
    pattern:
      /\b(?:scores?|metrics?|rankings?|statistics?)\b.{0,60}\b(?:human worth|personal worth|deserves? respect|value as a person|terminate|fire)\b/i,
  },
];

export function findProhibitedOutput(value: unknown): string[] {
  const text = JSON.stringify(value);
  return unique(
    prohibitedOutputRules
      .filter((rule) => rule.pattern.test(text))
      .map((rule) => rule.category),
  );
}

export function assertSafeIntelligenceOutput(value: unknown): void {
  const matches = findProhibitedOutput(value);
  if (matches.length > 0) {
    throw new Error("Generated output failed source-safety review.");
  }
}

export function getStrategyCards(): readonly StrategyCard[] {
  return cards;
}