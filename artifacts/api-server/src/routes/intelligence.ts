import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  coachProfilesTable,
  experiencesTable,
  knowledgeAssetsTable,
  practiceSessionsTable,
  promptRunsTable,
} from "@workspace/db";
import {
  ExtractExperienceKnowledgeBody,
  ExtractExperienceKnowledgeResponse,
  GenerateKnowledgeAssetBody,
  GenerateKnowledgeAssetResponse,
  ListKnowledgeAssetsResponse,
  RecommendNextActionBody,
  RecommendNextActionResponse,
  SimulateClientTurnBody,
  SimulateClientTurnResponse,
} from "@workspace/api-zod";
import {
  assetStrategies,
  generateStructured,
  IntelligenceSafetyError,
  type IntelligenceTrace,
} from "../lib/practice-intelligence.ts";
import {
  compactIntelligenceOperations,
  recordIntelligenceOperation,
  reportIntelligenceOperations,
} from "../lib/intelligence-operations.ts";
import {
  buildIntelligenceAlerts,
  classifyIntelligenceFailure,
  launchOperationalWrites,
} from "../lib/intelligence-operation-policy.ts";
import { normalizeGeneratedText } from "../lib/generated-text.ts";
import { logger } from "../lib/logger.ts";
import {
  selectStrategies,
  type StrategySelection,
} from "../lib/strategy-library.ts";
import {
  authenticatedUserId,
  requireAuth,
  requireOperator,
} from "../middlewares/requireAuth.ts";
import { intelligenceRateLimit } from "../middlewares/intelligenceRateLimit.ts";

const router: IRouter = Router();
router.use("/practice", requireAuth);
router.use("/practice/ai", intelligenceRateLimit);

async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(coachProfilesTable)
    .where(eq(coachProfilesTable.userId, userId))
    .limit(1);
  return profile;
}

function recordPromptRun(
  engine: string,
  strategy: string,
  inputSummary: string,
  outputSummary: string,
  userId: string,
  trace: IntelligenceTrace,
  startedAt: number,
) {
  launchOperationalWrites(
    [
      {
        name: "prompt audit",
        run: () =>
          db.insert(promptRunsTable).values({
            userId,
            engine,
            strategy,
            strategyVersion: trace.strategyVersion,
            strategyIds: trace.strategyIds,
            strategyFamilies: trace.strategyFamilies,
            sourceClasses: trace.sourceClasses,
            chainStages: trace.chainStages,
            safetyOutcome: trace.safetyOutcome,
            inputSummary: inputSummary.slice(0, 800),
            outputSummary: outputSummary.slice(0, 800),
          }),
      },
      {
        name: "operations telemetry",
        run: () =>
          recordIntelligenceOperation({
            engine,
            outcome: "success",
            startedAt,
            trace,
          }),
      },
    ],
    (name, error) =>
      logger.error({ err: error, engine, persistence: name }, "Intelligence persistence failed"),
  );
}

function recordFailedPromptRun(
  engine: string,
  userId: string,
  selection: StrategySelection | undefined,
  error: unknown,
  startedAt: number,
) {
  const classified = classifyIntelligenceFailure(error);
  const trace: IntelligenceTrace | undefined = selection
    ? error instanceof IntelligenceSafetyError
      ? error.trace
      : {
          strategyVersion: selection.version,
          strategyIds: selection.strategyIds,
          strategyFamilies: selection.families,
          sourceClasses: selection.sourceClasses,
          chainStages: ["execute", "review"],
          safetyOutcome: "generation-error",
        }
    : undefined;

  launchOperationalWrites(
    [
      {
        name: "operations telemetry",
        run: () =>
          recordIntelligenceOperation({
            engine,
            outcome: classified.outcome,
            failureClass: classified.failureClass,
            startedAt,
            selection,
            trace: error instanceof IntelligenceSafetyError ? error.trace : undefined,
          }),
      },
      ...(selection && trace
        ? [
            {
              name: "prompt audit",
              run: () =>
                db.insert(promptRunsTable).values({
                  userId,
                  engine,
                  strategy: selection.families.join(", "),
                  strategyVersion: trace.strategyVersion,
                  strategyIds: trace.strategyIds,
                  strategyFamilies: trace.strategyFamilies,
                  sourceClasses: trace.sourceClasses,
                  chainStages: trace.chainStages,
                  safetyOutcome: trace.safetyOutcome,
                  inputSummary: "Authenticated coach request",
                  outputSummary:
                    error instanceof IntelligenceSafetyError
                      ? "Output blocked by source-safety review"
                      : "Generation did not complete",
                }),
            },
          ]
        : []),
    ],
    (name, persistenceError) =>
      logger.error(
        { err: persistenceError, engine, persistence: name },
        "Intelligence failure persistence failed",
      ),
  );
}

router.get("/practice/assets", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const assets = await db
    .select()
    .from(knowledgeAssetsTable)
    .where(eq(knowledgeAssetsTable.userId, userId))
    .orderBy(desc(knowledgeAssetsTable.createdAt));
  res.json(ListKnowledgeAssetsResponse.parse(assets));
});

router.post("/practice/ai/simulate", async (req, res): Promise<void> => {
  const startedAt = Date.now();
  const userId = authenticatedUserId(req);
  const parsed = SimulateClientTurnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let selection: StrategySelection | undefined;
  try {
    const profile = await getProfile(userId);
    selection = selectStrategies({
      engine: "simulation",
      context: { profile, request: parsed.data },
    });
    const generated = await generateStructured<{
      clientReply: string;
      observation: string;
      skill: string;
      score: number;
      sessionComplete: boolean;
    }>(
      `You are the Practice Engine's client simulator and evaluator.
Act as the client in the requested scenario. Stay in character in clientReply and do not make
the interaction easy. Separately provide one concise private coaching observation.
Evaluate the coach's latest message for listening, questioning, reframing, challenge,
boundaries, structure, and intervention judgment. A score is 0-100. Do not complete before
four coach turns unless the coach clearly ends the session.
Return JSON only with clientReply, observation, skill, score, sessionComplete.`,
      JSON.stringify({ profile, ...parsed.data }),
      selection,
    );
    const result = generated.data;

    const output = SimulateClientTurnResponse.parse({
      ...result,
      score: Math.max(0, Math.min(100, Number(result.score))),
      sessionComplete: Boolean(result.sessionComplete),
    });
    await recordPromptRun(
      "Practice Simulator",
      selection.families.join(", "),
      `Authenticated ${parsed.data.difficulty} simulation turn`,
      "Reviewed simulation response accepted",
      userId,
      generated.trace,
      startedAt,
    );
    res.json(output);
  } catch (error) {
    await recordFailedPromptRun("Practice Simulator", userId, selection, error, startedAt);
    req.log.error({ err: error }, "Client simulation failed");
    res.status(502).json({ error: "The client simulator could not respond. Please try again." });
  }
});

router.post("/practice/ai/extract", async (req, res): Promise<void> => {
  const startedAt = Date.now();
  const userId = authenticatedUserId(req);
  const parsed = ExtractExperienceKnowledgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let selection: StrategySelection | undefined;
  try {
    const profile = await getProfile(userId);
    selection = selectStrategies({
      engine: "experience-extraction",
      context: { profile, experience: parsed.data },
    });
    const generated = await generateStructured<{
      title: string;
      lesson: string;
      principle: string;
      insight: string;
      frameworkCandidate: string;
      evidenceGap: string;
    }>(
      `You are the Practice Engine's experience analyst. Transform only what the coach actually
experienced into structured knowledge. Distinguish observation from inference. Do not invent
results, expertise, client details, or proof. Principles must be reusable but appropriately
qualified. The frameworkCandidate is a concise possible mechanism, not a validated method.
The evidenceGap must state what needs testing or proof.
Return JSON only with title, lesson, principle, insight, frameworkCandidate, evidenceGap.`,
      JSON.stringify({ profile, experience: parsed.data }),
      selection,
    );
    const result = generated.data;

    const output = ExtractExperienceKnowledgeResponse.parse({
      title: normalizeGeneratedText(result.title, "title"),
      lesson: normalizeGeneratedText(result.lesson, "lesson"),
      principle: normalizeGeneratedText(result.principle, "principle"),
      insight: normalizeGeneratedText(result.insight, "insight"),
      frameworkCandidate: normalizeGeneratedText(result.frameworkCandidate, "frameworkCandidate"),
      evidenceGap: normalizeGeneratedText(result.evidenceGap, "evidenceGap"),
    });
    await recordPromptRun(
      "Experience & Knowledge",
      selection.families.join(", "),
      "Authenticated lived-experience reflection",
      "Reviewed structured reflection accepted",
      userId,
      generated.trace,
      startedAt,
    );
    res.json(output);
  } catch (error) {
    await recordFailedPromptRun("Experience & Knowledge", userId, selection, error, startedAt);
    req.log.error({ err: error }, "Experience extraction failed");
    res.status(502).json({ error: "The experience could not be analyzed. Please try again." });
  }
});

router.post("/practice/ai/generate", async (req, res): Promise<void> => {
  const startedAt = Date.now();
  const userId = authenticatedUserId(req);
  const parsed = GenerateKnowledgeAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [experience] = await db
    .select()
    .from(experiencesTable)
    .where(and(eq(experiencesTable.id, parsed.data.sourceExperienceId), eq(experiencesTable.userId, userId)))
    .limit(1);
  if (!experience) {
    res.status(404).json({ error: "Source experience not found." });
    return;
  }

  let selection: StrategySelection | undefined;
  try {
    const profile = await getProfile(userId);
    const strategy =
      assetStrategies[parsed.data.assetType as keyof typeof assetStrategies];
    const preferredIds: Partial<Record<string, string[]>> = {
      brand: ["mkt-evidence-led-positioning"],
      content: ["mkt-content-repurposing"],
      workshop: ["mkt-learning-product-design"],
      course: ["mkt-learning-product-design"],
      exercise: ["mkt-learning-product-design"],
      offer: ["mkt-offer-packaging"],
    };
    selection = selectStrategies({
      engine: "asset-generation",
      context: {
        profile,
        sourceExperience: experience,
        objective: parsed.data.objective,
        assetType: parsed.data.assetType,
      },
      preferredIds: preferredIds[parsed.data.assetType],
      limit: 5,
    });
    const generated = await generateStructured<{ title: string; content: string }>(
      `You are the Practice Engine's ${strategy} specialist.
Create a useful ${parsed.data.assetType} grounded in the supplied source experience,
lesson, and principle. Preserve the coach's voice and audience. Never invent testimonials,
results, credentials, market facts, or validation. Include a final section titled
"Validation needed" stating what must be tested before the asset can be treated as proven.
Return JSON only with title and content. Content should be polished markdown.`,
      JSON.stringify({
        profile,
        sourceExperience: experience,
        objective: parsed.data.objective,
      }),
      selection,
    );
    const result = generated.data;

    const [asset] = await db
      .insert(knowledgeAssetsTable)
      .values({
        userId,
        sourceExperienceId: experience.id,
        type: parsed.data.assetType,
        title: result.title,
        content: result.content,
        promptStrategy: strategy,
      })
      .returning();

    const output = GenerateKnowledgeAssetResponse.parse(asset);
    await recordPromptRun(
      "Experience to IP",
      selection.families.join(", "),
      `Authenticated ${parsed.data.assetType} generation`,
      "Reviewed evidence-linked asset accepted",
      userId,
      generated.trace,
      startedAt,
    );
    res.status(201).json(output);
  } catch (error) {
    await recordFailedPromptRun("Experience to IP", userId, selection, error, startedAt);
    req.log.error({ err: error }, "Asset generation failed");
    res.status(502).json({ error: "The asset could not be generated. Please try again." });
  }
});

router.post("/practice/ai/next-action", async (req, res): Promise<void> => {
  const startedAt = Date.now();
  const userId = authenticatedUserId(req);
  const parsed = RecommendNextActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let selection: StrategySelection | undefined;
  try {
    const [profile, experiences, sessions, assets] = await Promise.all([
      getProfile(userId),
      db.select().from(experiencesTable).where(eq(experiencesTable.userId, userId)).orderBy(desc(experiencesTable.createdAt)).limit(5),
      db.select().from(practiceSessionsTable).where(eq(practiceSessionsTable.userId, userId)).orderBy(desc(practiceSessionsTable.createdAt)).limit(5),
      db.select().from(knowledgeAssetsTable).where(eq(knowledgeAssetsTable.userId, userId)).orderBy(desc(knowledgeAssetsTable.createdAt)).limit(5),
    ]);

    selection = selectStrategies({
      engine: "next-action",
      context: {
        profile,
        recentExperiences: experiences,
        recentSessions: sessions,
        recentAssets: assets,
        request: parsed.data,
      },
      limit: 5,
    });
    const generated = await generateStructured<{
      action: string;
      reason: string;
      engine: string;
      duration: string;
      successCriteria: string[];
    }>(
      `You are the Practice Engine's growth orchestrator. Recommend exactly one next action,
not general advice. Prioritize coach development and evidence before marketing output.
Use the available time. Choose among Development, Simulator, Delivery, Knowledge,
Methodology, Brand, Content, Course, Product, or Proof. Return JSON only with action,
reason, engine, duration, successCriteria (2-4 measurable strings).`,
      JSON.stringify({ profile, recentExperiences: experiences, recentSessions: sessions, recentAssets: assets, request: parsed.data }),
      selection,
    );
    const result = generated.data;

    const output = RecommendNextActionResponse.parse({
      ...result,
      duration:
        typeof result.duration === "number"
          ? `${result.duration} min`
          : String(result.duration),
      successCriteria: Array.isArray(result.successCriteria)
        ? result.successCriteria.map(String)
        : [String(result.successCriteria)],
    });
    await recordPromptRun(
      "Growth Orchestration",
      selection.families.join(", "),
      "Authenticated next-action request",
      "Reviewed next action accepted",
      userId,
      generated.trace,
      startedAt,
    );
    res.json(output);
  } catch (error) {
    await recordFailedPromptRun("Growth Orchestration", userId, selection, error, startedAt);
    req.log.error({ err: error }, "Next-action recommendation failed");
    res.status(502).json({ error: "A next action could not be selected. Please try again." });
  }
});

router.get(
  "/practice/operations/intelligence",
  requireOperator,
  async (req, res): Promise<void> => {
    const requestedHours = Number(req.query.hours ?? 24);
    const hours = Number.isFinite(requestedHours)
      ? Math.min(720, Math.max(1, Math.floor(requestedHours)))
      : 24;
    const bucket = hours <= 72 ? "hour" : "day";
    await compactIntelligenceOperations();

    const [result, latestResult] = await Promise.all([
      reportIntelligenceOperations(hours),
      db.execute(sql`
        select outcome, count(*)::integer as count
        from intelligence_operations
        where created_at >= now() - (
          ${bucket === "hour" ? 1 : 24} * interval '1 hour'
        )
        group by outcome
      `),
    ]);

    const rows = result.rows as Array<{
      bucket: Date | string;
      engine: string;
      strategyVersion: string;
      strategyFamily: string;
      outcome: string;
      failureClass: string | null;
      count: number;
      averageLatencyMs: number;
      p95LatencyMs: number;
    }>;
    const totals = (latestResult.rows as Array<{
      outcome: string;
      count: number;
    }>).reduce(
      (acc, row) => {
        acc.total += row.count;
        acc[row.outcome] = (acc[row.outcome] ?? 0) + row.count;
        return acc;
      },
      { total: 0 } as Record<string, number>,
    );
    const alerts = buildIntelligenceAlerts(totals);

    res.json({
      windowHours: hours,
      bucket,
      generatedAt: new Date().toISOString(),
      trends: rows,
      alerts,
    });
  },
);

export default router;