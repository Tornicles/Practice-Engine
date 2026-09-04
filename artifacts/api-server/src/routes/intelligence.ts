import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
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
} from "../lib/practice-intelligence";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use("/practice", requireAuth);

async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(coachProfilesTable)
    .where(eq(coachProfilesTable.userId, userId))
    .limit(1);
  return profile;
}

async function recordPromptRun(
  engine: string,
  strategy: string,
  inputSummary: string,
  outputSummary: string,
  userId: string,
) {
  await db.insert(promptRunsTable).values({
    userId,
    engine,
    strategy,
    inputSummary: inputSummary.slice(0, 800),
    outputSummary: outputSummary.slice(0, 800),
  });
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
  const userId = authenticatedUserId(req);
  const parsed = SimulateClientTurnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const profile = await getProfile(userId);
    const result = await generateStructured<{
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
    );

    const output = SimulateClientTurnResponse.parse({
      ...result,
      score: Math.max(0, Math.min(100, Number(result.score))),
      sessionComplete: Boolean(result.sessionComplete),
    });
    await recordPromptRun(
      "Practice Simulator",
      `Adaptive ${parsed.data.difficulty} client simulation`,
      `${parsed.data.scenario}: ${parsed.data.coachMessage}`,
      `${output.skill} ${output.score}: ${output.observation}`,
      userId,
    );
    res.json(output);
  } catch (error) {
    req.log.error({ err: error }, "Client simulation failed");
    res.status(502).json({ error: "The client simulator could not respond. Please try again." });
  }
});

router.post("/practice/ai/extract", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const parsed = ExtractExperienceKnowledgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const profile = await getProfile(userId);
    const result = await generateStructured<{
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
    );

    const output = ExtractExperienceKnowledgeResponse.parse(result);
    await recordPromptRun(
      "Experience & Knowledge",
      "Experience-to-principle extraction",
      parsed.data.situation,
      `${output.principle} Evidence gap: ${output.evidenceGap}`,
      userId,
    );
    res.json(output);
  } catch (error) {
    req.log.error({ err: error }, "Experience extraction failed");
    res.status(502).json({ error: "The experience could not be analyzed. Please try again." });
  }
});

router.post("/practice/ai/generate", async (req, res): Promise<void> => {
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

  try {
    const profile = await getProfile(userId);
    const strategy =
      assetStrategies[parsed.data.assetType as keyof typeof assetStrategies];
    const result = await generateStructured<{ title: string; content: string }>(
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
    );

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
      strategy,
      `${experience.title}: ${parsed.data.objective}`,
      output.title,
      userId,
    );
    res.status(201).json(output);
  } catch (error) {
    req.log.error({ err: error }, "Asset generation failed");
    res.status(502).json({ error: "The asset could not be generated. Please try again." });
  }
});

router.post("/practice/ai/next-action", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const parsed = RecommendNextActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [profile, experiences, sessions, assets] = await Promise.all([
      getProfile(userId),
      db.select().from(experiencesTable).where(eq(experiencesTable.userId, userId)).orderBy(desc(experiencesTable.createdAt)).limit(5),
      db.select().from(practiceSessionsTable).where(eq(practiceSessionsTable.userId, userId)).orderBy(desc(practiceSessionsTable.createdAt)).limit(5),
      db.select().from(knowledgeAssetsTable).where(eq(knowledgeAssetsTable.userId, userId)).orderBy(desc(knowledgeAssetsTable.createdAt)).limit(5),
    ]);

    const result = await generateStructured<{
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
    );

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
      "Contextual next-best action",
      parsed.data.currentObjective,
      `${output.engine}: ${output.action}`,
      userId,
    );
    res.json(output);
  } catch (error) {
    req.log.error({ err: error }, "Next-action recommendation failed");
    res.status(502).json({ error: "A next action could not be selected. Please try again." });
  }
});

export default router;