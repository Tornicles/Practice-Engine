export type ValidationStatus =
  | "raw"
  | "candidate"
  | "draft"
  | "testing"
  | "supported"
  | "validated"
  | "needs_revision"
  | "retired";

export type ConditionLevel =
  | "healthy"
  | "improving"
  | "declining"
  | "at_risk"
  | "insufficient_evidence";

export type SkillKey = "listening" | "questioning" | "reframing" | "challenge";

export type JobType = "practice" | "reflect" | "build";

export type ReuseDest =
  | "coaching"
  | "content"
  | "course"
  | "workshop"
  | "assessment"
  | "book"
  | "offer";

export type ContentKind =
  | "authority"
  | "educational"
  | "relationship"
  | "demand"
  | "conversion"
  | "proof";

export interface Coach {
  name: string;
  niche: string;
  audience: string;
  experienceLevel: string;
  philosophy: string;
  goal: string;
  developmentFocus: string;
}

export interface Objective {
  id: string;
  title: string;
  type: string;
  priority: "high" | "medium" | "low";
  status: "active" | "done";
  successCriteria: string;
}

export interface Observation {
  id: string;
  skill: SkillKey;
  score: number;
  sourceType: "simulation" | "session" | "assessment";
  sourceId: string;
  note: string;
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  scenario: string;
  skill: SkillKey;
  difficulty: number;
  turns: { role: "coach" | "client"; text: string }[];
  scores: Partial<Record<SkillKey, number>> & { overall: number };
  strengths: string;
  weaknesses: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  role: string;
  status: "active" | "paused";
  objective: string;
  currentState: string;
}

export interface DeliverySession {
  id: string;
  clientId: string;
  date: string;
  objective: string;
  notes: string;
  intervention: string;
  clientResponse: string;
  outcome: string;
  followUp: string;
}

export interface Experience {
  id: string;
  title: string;
  sourceType: "session" | "simulation" | "career" | "manual";
  sourceId?: string;
  situation: string;
  action: string;
  result: string;
  reflection: string;
  lesson: string;
  insight: string;
  principleId?: string;
  frameworkCandidate?: string;
  evidenceGap?: string;
  validationStatus: ValidationStatus;
  createdAt: string;
}

export interface Principle {
  id: string;
  statement: string;
  explanation: string;
  context?: string;
  experienceIds: string[];
  contradictingIds: string[];
  validationStatus: ValidationStatus;
  confidence: number;
}

export interface Method {
  id: string;
  name: string;
  purpose: string;
  whenToUse: string;
  whenNotToUse: string;
  steps: string[];
  expectedOutcome: string;
  principleIds: string[];
  validationStatus: ValidationStatus;
}

export interface Framework {
  id: string;
  name: string;
  problem: string;
  components: string[];
  sequence: string;
  principleIds: string[];
  methodId?: string;
  validationStatus: ValidationStatus;
  version: number;
  changeNote?: string;
}

export interface Protocol {
  id: string;
  name: string;
  methodId: string;
  steps: string[];
}

export interface Drill {
  id: string;
  name: string;
  skill: SkillKey;
  protocolId: string;
  minutes: number;
  href: string;
  tab?: string;
}

export interface IPAsset {
  id: string;
  type: "framework" | "method" | "protocol" | "exercise" | "playbook";
  title: string;
  description: string;
  frameworkId?: string;
  status: ValidationStatus;
  version: number;
  sourceLineage: string[];
  reuse: ReuseDest[];
}

export interface MethodologyTest {
  id: string;
  frameworkId: string;
  context: string;
  hypothesis: string;
  application: string;
  result: string;
  conclusion: string;
  status: ValidationStatus;
  createdAt: string;
}

export interface MessagingPillar {
  id: string;
  name: string;
  principleId: string;
  problem: string;
  proofIds: string[];
  contentIds: string[];
}

export interface BrandState {
  positioning: string;
  audience: string;
  problem: string;
  promise: string;
  differentiator: string;
  pov: string;
  tagline: string;
  shortBio: string;
  longBio: string;
  values: string[];
  claims: { claim: string; proofIds: string[] }[];
}

export interface ProofItem {
  id: string;
  type: "outcome" | "case-study" | "testimonial" | "framework";
  claim: string;
  source: string;
  verificationStatus: "unverified" | "verified";
}

export interface AudienceSegment {
  id: string;
  name: string;
  characteristics: string;
  problems: string[];
  objections: string[];
  interests: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  format: "post" | "article" | "thread" | "case-study" | "video" | "newsletter" | "carousel";
  kind: ContentKind;
  status: "idea" | "draft" | "review" | "published";
  sourceExperienceId?: string;
  principleId?: string;
  message: string;
  platform: string;
  questions: string[];
  createdAt: string;
}

export interface Offer {
  id: string;
  name: string;
  type: string;
  audience: string;
  problem: string;
  promise: string;
  methodology: string;
  frameworkId?: string;
  components: string[];
  deliveryModel: string;
  duration: string;
  price: string;
  status: "idea" | "draft" | "testing" | "validated" | "needs_revision" | "paused";
}

export interface Opportunity {
  id: string;
  offerId: string;
  prospect: string;
  stage: "lead" | "qualified" | "conversation" | "proposed" | "won" | "lost";
  value: number;
  reason?: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  outcome: string;
  methodology: string;
  frameworkId?: string;
  modules: { title: string; objective: string }[];
  status: "draft" | "pilot" | "validated";
}

export interface Investigation {
  id: string;
  trigger: string;
  problem: string;
  hypotheses: { text: string; for: string; against: string; selected?: boolean }[];
  rootCause?: string;
  correction?: string;
  expected?: string;
  status: "open" | "correcting" | "verified" | "closed";
  createdAt: string;
}

export interface TodayJob {
  id: string;
  type: JobType;
  title: string;
  detail: string;
  href: string;
  tab?: string;
  minutes: number;
  done: boolean;
}

export interface AiAudit {
  id: string;
  actionType: string;
  targetEngine: string;
  strategy: string;
  evidenceStatus: string;
  createdAt: string;
}

export type MessageChannel = "client" | "lead" | "network";

export interface ChatMessage {
  id: string;
  from: "coach" | "them";
  text: string;
  at: string;
}

export interface MessageThread {
  id: string;
  channel: MessageChannel;
  withName: string;
  withRole: string;
  unread: number;
  priority: boolean;
  relatedClientId?: string;
  relatedOpportunityId?: string;
  subject: string;
  messages: ChatMessage[];
}

export interface AppSettings {
  assistanceLevel: "low" | "medium" | "high";
  generationStyle: "conservative" | "balanced" | "bold";
  notifications: {
    development: boolean;
    clients: boolean;
    content: boolean;
    messages: boolean;
    conditions: boolean;
    recommendations: boolean;
  };
  privacy: {
    clientDataVisible: boolean;
    aiPermissions: boolean;
  };
}

export interface EngineState {
  hydrated: boolean;
  coach: Coach;
  objectives: Objective[];
  observations: Observation[];
  practices: PracticeSession[];
  clients: Client[];
  sessions: DeliverySession[];
  experiences: Experience[];
  principles: Principle[];
  methods: Method[];
  frameworks: Framework[];
  protocols: Protocol[];
  drills: Drill[];
  ipAssets: IPAsset[];
  methodologyTests: MethodologyTest[];
  brand: BrandState;
  proofs: ProofItem[];
  pillars: MessagingPillar[];
  segments: AudienceSegment[];
  content: ContentItem[];
  offers: Offer[];
  opportunities: Opportunity[];
  products: Product[];
  investigations: Investigation[];
  todayJobs: TodayJob[];
  todayStamp: string;
  aiAudits: AiAudit[];
  threads: MessageThread[];
  settings: AppSettings;
}
