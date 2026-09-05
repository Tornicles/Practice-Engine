import type { AreaPath } from "./nav";
import type { ConditionLevel, EngineState, SkillKey } from "./types";

const SKILLS: { key: SkillKey; label: string; target: number }[] = [
  { key: "listening", label: "Listening", target: 88 },
  { key: "questioning", label: "Questioning", target: 90 },
  { key: "reframing", label: "Reframing", target: 80 },
  { key: "challenge", label: "Challenge", target: 80 },
];

export function skillViews(state: EngineState) {
  return SKILLS.map((meta) => {
    const obs = state.observations.filter((o) => o.skill === meta.key);
    const recent = [...obs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const current = recent[0]?.score ?? 0;
    const previous = recent[1]?.score ?? current;
    const trend =
      current - previous > 2 ? "improving" : current - previous < -2 ? "declining" : "steady";
    const confidence = obs.length >= 8 ? "high" : obs.length >= 3 ? "medium" : "low";
    return {
      ...meta,
      current,
      previous,
      trend,
      evidence: obs.length,
      confidence,
      gap: Math.max(0, meta.target - current),
    };
  });
}

export function practiceScore(state: EngineState) {
  const skills = skillViews(state);
  if (!skills.some((s) => s.evidence)) return 0;
  return Math.round(skills.reduce((sum, s) => sum + s.current, 0) / skills.length);
}

export function operatingState(state: EngineState) {
  const jobsLeft = state.todayJobs.filter((j) => !j.done).length;
  const openInv = state.investigations.some((i) => i.status === "open" || i.status === "correcting");
  if (openInv) return "Investigating";
  if (jobsLeft === 3) return "Planning";
  if (jobsLeft > 0) return "Practicing";
  return "Reflecting";
}

function rankLevel(level: ConditionLevel) {
  if (level === "at_risk") return 4;
  if (level === "declining") return 3;
  if (level === "insufficient_evidence") return 2;
  if (level === "improving") return 1;
  return 0;
}

function worstLevel(levels: ConditionLevel[]): ConditionLevel {
  return levels.reduce((acc, level) => (rankLevel(level) > rankLevel(acc) ? level : acc), "healthy" as ConditionLevel);
}

export interface ConditionView {
  id: string;
  domain: string;
  level: ConditionLevel;
  title: string;
  why: string;
  evidence: string;
  next: string;
  to: AreaPath;
  tab?: string;
}

export function conditions(state: EngineState): ConditionView[] {
  const skills = skillViews(state);
  const challenge = skills.find((s) => s.key === "challenge")!;
  const last7 = Date.now() - 7 * 86400000;
  const recentPractice = state.practices.filter((p) => new Date(p.createdAt).getTime() > last7).length;
  const lost = state.opportunities.filter((o) => o.stage === "lost").length;
  const unverifiedClaims = state.brand.claims.filter((c) => c.proofIds.length === 0).length;
  const supportedPrinciples = state.principles.filter((p) =>
    ["supported", "validated"].includes(p.validationStatus),
  ).length;
  const testingFrameworks = state.frameworks.filter((f) => f.validationStatus === "testing").length;
  const questions = state.content.reduce((n, c) => n + c.questions.length, 0);
  const lastSession = state.sessions[0];

  const development: ConditionView = {
    id: "c-dev",
    domain: "Development",
    level:
      challenge.evidence < 3
        ? "insufficient_evidence"
        : challenge.current < 62
          ? "at_risk"
          : challenge.trend === "improving"
            ? "improving"
            : "healthy",
    title: "Challenge under resistance",
    why: `Challenge is ${challenge.current} against a target of ${challenge.target}. Trend ${challenge.trend}.`,
    evidence: `${challenge.evidence} observations · ${recentPractice} practices this week`,
    next: "Run a high-resistance simulation and capture the intervention timing.",
    to: "/development",
    tab: "practice",
  };

  const practice: ConditionView = {
    id: "c-practice",
    domain: "Practice",
    level:
      state.practices.length === 0 && (state.events?.length ?? 0) === 0
        ? "insufficient_evidence"
        : recentPractice === 0
          ? "declining"
          : recentPractice >= 2
            ? "improving"
            : "healthy",
    title:
      state.practices.length === 0 && (state.events?.length ?? 0) === 0
        ? "Insufficient evidence — not poor performance"
        : recentPractice === 0
          ? "No practice this week"
          : "Practice is in motion",
    why:
      state.practices.length === 0 && (state.events?.length ?? 0) === 0
        ? "No events recorded. Insufficient evidence is not a decline."
        : recentPractice === 0
          ? "Skill scores go stale without a recent drill. Today's resistance simulation is still open."
          : `${recentPractice} practice session(s) in the last 7 days.`,
    evidence: `${state.practices.length} sessions on record`,
    next: "Complete today's resistance drill.",
    to: "/development",
    tab: "practice",
  };

  const clients: ConditionView = {
    id: "c-clients",
    domain: "Client delivery",
    level: lastSession ? "improving" : "insufficient_evidence",
    title: lastSession ? "Live rooms are producing evidence" : "No recent client sessions",
    why: lastSession
      ? `${state.clients.filter((c) => c.status === "active").length} active clients. Follow-up still open: ${lastSession.followUp}`
      : "Client work is the richest source of expertise. Nothing is logged this week.",
    evidence: `${state.sessions.length} sessions · ${state.clients.length} clients`,
    next: lastSession ? "Prepare the next session and close the follow-up." : "Log a client session.",
    to: "/clients",
    tab: "session",
  };

  const expertise: ConditionView = {
    id: "c-exp",
    domain: "Expertise",
    level:
      state.experiences.length < 2
        ? "insufficient_evidence"
        : supportedPrinciples >= 1
          ? "improving"
          : "declining",
    title: "Experience turning into expertise",
    why: `${state.experiences.length} experiences, ${supportedPrinciples} supported principles, ${state.frameworks.length} frameworks.`,
    evidence: "Lineage exists for R.E.A.D. and diagnosis-before-prescription.",
    next: "Validate or limit the trust-before-challenge principle.",
    to: "/development",
    tab: "expertise",
  };

  const content: ConditionView = {
    id: "c-content",
    domain: "Content",
    level:
      unverifiedClaims > 0
        ? "declining"
        : questions >= 2
          ? "improving"
          : state.content.some((c) => c.status === "published")
            ? "healthy"
            : "insufficient_evidence",
    title: unverifiedClaims > 0 ? "Authority is ahead of proof" : "Audience questions are usable",
    why:
      unverifiedClaims > 0
        ? `${unverifiedClaims} brand claim(s) have no attached proof. ${questions} audience questions logged.`
        : `${state.content.filter((c) => c.status === "published").length} published · ${questions} questions.`,
    evidence: `${state.proofs.length} proof items · ${state.content.length} assets`,
    next: unverifiedClaims > 0 ? "Attach a verified case study before the next post." : "Draft from a live lesson.",
    to: "/content",
    tab: unverifiedClaims > 0 ? "brand" : "create",
  };

  const commercial: ConditionView = {
    id: "c-com",
    domain: "Commercial",
    level: lost >= 2 ? "at_risk" : "improving",
    title: "Decision Room conversion",
    why: lost >= 2 ? `${lost} lost opportunities. Proof and audience cited.` : "Pipeline is moving.",
    evidence: `${state.opportunities.length} opportunities · offer status ${state.offers[0]?.status}`,
    next: "Do not generate another sales page. Close the open investigation.",
    to: "/development",
    tab: "improve",
  };

  const overallLevel = worstLevel([
    development.level,
    practice.level,
    clients.level,
    expertise.level,
    content.level,
    commercial.level,
  ]);

  const overall: ConditionView = {
    id: "c-overall",
    domain: "Overall",
    level: overallLevel,
    title:
      overallLevel === "at_risk"
        ? "The practice needs a correction, not more activity"
        : overallLevel === "declining"
          ? "A few conditions are slipping"
          : "The practice is compounding",
    why: "Overall is the weakest of development, practice, client delivery, expertise, and content — not an average of vanity metrics.",
    evidence: `${testingFrameworks} framework(s) in testing`,
    next: overallLevel === "at_risk" ? "Investigate the stall before creating more assets." : "Do today's recommended action.",
    to: overallLevel === "at_risk" ? "/development" : "/",
    tab: overallLevel === "at_risk" ? "improve" : undefined,
  };

  return [practice, development, clients, expertise, content, commercial, overall];
}

export function currentStateViews(state: EngineState) {
  const conds = conditions(state);
  const pick = (id: string) => conds.find((c) => c.id === id)!;
  return [
    pick("c-dev"),
    pick("c-practice"),
    pick("c-clients"),
    pick("c-exp"),
    pick("c-content"),
    pick("c-overall"),
  ];
}

export function nextAction(state: EngineState) {
  const job = state.todayJobs.find((j) => !j.done);
  const cond = conditions(state).find((c) => c.level === "at_risk");
  const openInv = state.investigations.find((i) => i.status === "open");
  const weak = skillViews(state).sort((a, b) => a.current - b.current)[0];

  if (openInv) {
    return {
      title: "Investigate the commercial stall",
      why: openInv.problem,
      action: "Choose a root cause and a correction you can verify.",
      to: "/development" as AreaPath,
      tab: "improve",
      minutes: 12,
      skill: "judgment",
    };
  }
  if (job) {
    return {
      title: job.title,
      why: "Today's plan sequences practice, capture, then build.",
      action: job.detail,
      to: (job.href || "/") as AreaPath,
      tab: job.tab,
      minutes: job.minutes,
      skill: state.coach.developmentFocus,
    };
  }
  if (cond) {
    return {
      title: cond.title,
      why: cond.why,
      action: cond.next,
      to: cond.to,
      tab: cond.tab,
      minutes: 15,
      skill: weak.label,
    };
  }
  return {
    title: `Practice ${weak.label}`,
    why: `${weak.label} is the largest gap to target.`,
    action: "One focused drill, then capture what happened.",
    to: "/development" as AreaPath,
    tab: "practice",
    minutes: 10,
    skill: weak.label,
  };
}

export function aiNextActions(state: EngineState) {
  const weak = skillViews(state).sort((a, b) => a.current - b.current)[0];
  const inv = state.investigations.find((i) => i.status === "open" || i.status === "correcting");
  const session = state.sessions[0];
  const client = state.clients.find((c) => c.id === session?.clientId);
  const draft = state.content.find((c) => c.status === "draft" || c.status === "idea");
  const principle = state.principles.find((p) => p.validationStatus === "testing" || p.validationStatus === "candidate");
  const unread = state.threads.find((t) => t.unread > 0);

  return [
    {
      verb: "Practice this",
      title: `${weak.label} under resistance`,
      why: `${weak.label} is ${weak.current} with a gap of ${weak.gap}.`,
      to: "/development" as AreaPath,
      tab: "practice",
    },
    {
      verb: "Investigate this",
      title: inv?.problem ?? "No open investigation",
      why: inv?.trigger ?? "Conditions are currently stable.",
      to: "/development" as AreaPath,
      tab: "improve",
    },
    {
      verb: "Capture this",
      title: session ? `${client?.name ?? "Client"} session lesson` : "A live or practice moment",
      why: session?.outcome || "Experience only becomes expertise once it is captured.",
      to: "/development" as AreaPath,
      tab: "experience",
    },
    {
      verb: "Improve this",
      title: principle?.statement ?? "A principle still in testing",
      why: principle ? `Status ${principle.validationStatus} · confidence ${Math.round(principle.confidence * 100)}.` : "No open principle.",
      to: "/development" as AreaPath,
      tab: "expertise",
    },
    {
      verb: "Create this",
      title: draft?.title ?? "A lesson from a supported principle",
      why: draft ? "A draft is waiting — do not start a new thread." : "Turn a supported lesson into a public asset.",
      to: "/content" as AreaPath,
      tab: "create",
    },
    {
      verb: "Follow up on this",
      title: unread ? `${unread.withName}: ${unread.subject}` : session?.followUp || "Client commitments",
      why: unread ? `${unread.unread} unread` : session ? "A commitment is still unverified." : "Nothing waiting.",
      to: unread ? ("/messages" as AreaPath) : ("/clients" as AreaPath),
      tab: unread ? "inbox" : "session",
    },
  ];
}

export function stats(state: EngineState) {
  const last30 = Date.now() - 30 * 86400000;
  const practices30 = state.practices.filter((p) => new Date(p.createdAt).getTime() > last30).length;
  const sessions30 = state.sessions.filter((s) => new Date(s.date).getTime() > last30).length;
  const won = state.opportunities.filter((o) => o.stage === "won").length;
  const lost = state.opportunities.filter((o) => o.stage === "lost").length;
  const closed = won + lost;
  const pipelineValue = state.opportunities
    .filter((o) => !["won", "lost"].includes(o.stage))
    .reduce((n, o) => n + o.value, 0);
  const lostValue = state.opportunities.filter((o) => o.stage === "lost").reduce((n, o) => n + o.value, 0);
  return {
    practiceScore: practiceScore(state),
    practices30,
    sessions30,
    experiences: state.experiences.length,
    principles: state.principles.length,
    frameworks: state.frameworks.length,
    methods: state.methods.length,
    ipAssets: state.ipAssets.length,
    tests: state.methodologyTests.length,
    contentPublished: state.content.filter((c) => c.status === "published").length,
    audienceQuestions: state.content.reduce((n, c) => n + c.questions.length, 0),
    pipeline: state.opportunities.filter((o) => !["won", "lost"].includes(o.stage)).length,
    pipelineValue,
    lostValue,
    conversion: closed ? Math.round((won / closed) * 100) : 0,
    openInvestigations: state.investigations.filter((i) => i.status !== "closed" && i.status !== "verified").length,
    unsupportedClaims: state.brand.claims.filter((c) => c.proofIds.length === 0).length,
  };
}

export function flywheel(state: EngineState) {
  const s = stats(state);
  const conds = conditions(state);
  const pick = (id: string) => conds.find((c) => c.id === id)?.level ?? "insufficient_evidence";
  return [
    { id: "practice", label: "Practice", to: "/development" as AreaPath, tab: "practice", meta: `${s.practices30} / 30d`, level: pick("c-practice") },
    { id: "delivery", label: "Client work", to: "/clients" as AreaPath, tab: "session", meta: `${s.sessions30} sessions`, level: pick("c-clients") },
    { id: "experience", label: "Learning", to: "/development" as AreaPath, tab: "experience", meta: `${s.experiences} captured`, level: pick("c-exp") },
    { id: "methodology", label: "Methodology", to: "/development" as AreaPath, tab: "methodology", meta: `${s.frameworks} frameworks`, level: pick("c-exp") },
    { id: "content", label: "Content", to: "/content" as AreaPath, tab: "create", meta: `${s.contentPublished} live`, level: pick("c-content") },
    { id: "offer", label: "Offers", to: "/content" as AreaPath, tab: "offers", meta: state.offers[0]?.status ?? "none", level: pick("c-com") },
  ];
}

export function authorityGaps(state: EngineState) {
  const gaps: { title: string; why: string; to: AreaPath; tab?: string }[] = [];
  for (const claim of state.brand.claims) {
    if (claim.proofIds.length === 0) {
      gaps.push({
        title: claim.claim,
        why: "No proof object attached. Do not use this as authority.",
        to: "/content",
        tab: "brand",
      });
    }
  }
  const fw = state.frameworks[0];
  if (fw && fw.validationStatus !== "validated" && fw.validationStatus !== "supported") {
    gaps.push({
      title: "Signature methodology is still in testing",
      why: `${fw.name} is ${fw.validationStatus}. Offers that sell it should stay in testing.`,
      to: "/development",
      tab: "methodology",
    });
  }
  if (state.proofs.every((p) => p.verificationStatus !== "verified")) {
    gaps.push({
      title: "No verified case study",
      why: "Outcomes exist, but none are marked verified with permission.",
      to: "/content",
      tab: "brand",
    });
  }
  return gaps;
}

export function commercialHealth(state: EngineState) {
  const s = stats(state);
  const fw = state.frameworks.find((f) => f.id === state.offers[0]?.frameworkId);
  const sellingUnvalidated = fw && !["supported", "validated"].includes(fw.validationStatus);
  return {
    sellingUnvalidated: Boolean(sellingUnvalidated),
    methodologyStatus: fw?.validationStatus ?? "none",
    conversion: s.conversion,
    pipelineValue: s.pipelineValue,
    lostValue: s.lostValue,
    warning: sellingUnvalidated
      ? "This offer is selling a methodology that is still in testing. That is a commercial hypothesis, not a validated product."
      : "Offer methodology is supported by evidence.",
  };
}

export function heuristicScore(text: string) {
  const t = text.toLowerCase();
  const q = (text.match(/\?/g) || []).length;
  const listening = /it sounds|you'?re |what i hear|notice/.test(t) ? 82 : 64;
  const questioning = q >= 2 ? 84 : q === 1 ? 74 : 58;
  const reframing = /instead|another way|reframe|what if this is/.test(t) ? 76 : 60;
  const challenge = /the pattern|you keep|name it|stall|avoid/.test(t) ? 72 : 54;
  const overall = Math.round((listening + questioning + reframing + challenge) / 4);
  return { listening, questioning, reframing, challenge, overall };
}

export function intelligenceRoute(state: EngineState) {
  const openInv = state.investigations.find((i) => i.status === "open");
  if (openInv) {
    return {
      intent: "Why isn't the offer converting?",
      strategy: "Investigate",
      context: ["Coach profile", "Decision Room losses", "Claim-to-proof gaps", "Methodology status"],
    };
  }
  const job = state.todayJobs.find((j) => !j.done);
  if (job?.type === "practice") {
    return {
      intent: "Help me practice resistance",
      strategy: "Simulate",
      context: ["Development focus", "Challenge scores", "Diagnostic protocol"],
    };
  }
  return {
    intent: "What should happen next?",
    strategy: "Recommend",
    context: ["Today's jobs", "Conditions", "Profile"],
  };
}

export function recentWins(state: EngineState) {
  const wins: { title: string; meta: string }[] = [];
  const best = [...state.practices].sort((a, b) => b.scores.overall - a.scores.overall)[0];
  if (best) wins.push({ title: `${best.scenario} scored ${best.scores.overall}`, meta: "Practice" });
  const published = state.content.find((c) => c.status === "published");
  if (published) wins.push({ title: published.title, meta: "Published" });
  const session = state.sessions[0];
  if (session?.outcome) wins.push({ title: session.outcome, meta: "Client outcome" });
  return wins.slice(0, 3);
}

export function activityFeed(state: EngineState) {
  const items: { kind: string; title: string; meta: string; at: string; to: AreaPath; tab?: string }[] = [];
  for (const p of state.practices) {
    items.push({
      kind: "Practice",
      title: p.scenario,
      meta: `Score ${p.scores.overall}`,
      at: p.createdAt,
      to: "/development",
      tab: "practice",
    });
  }
  for (const s of state.sessions) {
    const client = state.clients.find((c) => c.id === s.clientId);
    items.push({
      kind: "Client session",
      title: client?.name ?? "Session",
      meta: s.objective,
      at: s.date,
      to: "/clients",
      tab: "session",
    });
  }
  for (const e of state.experiences) {
    items.push({
      kind: "Experience",
      title: e.title,
      meta: e.lesson,
      at: e.createdAt,
      to: "/development",
      tab: "experience",
    });
  }
  for (const c of state.content) {
    items.push({
      kind: "Content",
      title: c.title,
      meta: c.status,
      at: c.createdAt,
      to: "/content",
      tab: "create",
    });
  }
  for (const p of state.proofs) {
    items.push({
      kind: "Evidence",
      title: p.claim,
      meta: p.verificationStatus,
      at: state.sessions[0]?.date ?? new Date().toISOString(),
      to: "/content",
      tab: "brand",
    });
  }
  for (const o of state.observations.slice(0, 4)) {
    items.push({
      kind: "Assessment",
      title: `${o.skill} ${o.score}`,
      meta: o.note,
      at: o.createdAt,
      to: "/development",
      tab: "assessments",
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}
