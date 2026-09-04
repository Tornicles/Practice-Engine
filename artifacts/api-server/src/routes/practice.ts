import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  coachProfilesTable,
  experiencesTable,
  knowledgeAssetsTable,
  practiceSessionsTable,
} from "@workspace/db";
import {
  CreateExperienceBody,
  CreateExperienceResponse,
  CreatePracticeSessionBody,
  CreatePracticeSessionResponse,
  GetPracticeOverviewResponse,
  GetPracticeProfileResponse,
  ListExperiencesResponse,
  ListPracticeSessionsResponse,
  UpdatePracticeProfileBody,
  UpdatePracticeProfileResponse,
} from "@workspace/api-zod";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";

const router: IRouter = Router();
router.use("/practice", requireAuth);

async function getOrCreateProfile(userId: string) {
  const [existing] = await db
    .select()
    .from(coachProfilesTable)
    .where(eq(coachProfilesTable.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(coachProfilesTable)
    .values({
      userId,
      name: "Coach",
      niche: "Leadership & Business Coaching",
      experienceLevel: "Developing coach",
      audience: "Growth-stage leaders navigating major transitions",
      goal: "Become a better coach",
      developmentFocus: "Questioning under resistance",
    })
    .onConflictDoNothing({ target: coachProfilesTable.userId })
    .returning();
  if (created) return created;

  const [concurrentProfile] = await db
    .select()
    .from(coachProfilesTable)
    .where(eq(coachProfilesTable.userId, userId))
    .limit(1);

  if (!concurrentProfile) {
    throw new Error("Unable to provision the coach profile.");
  }

  return concurrentProfile;
}

async function validateOnboardingReferences(
  userId: string,
  onboardingData: {
    practice?: { sessionId?: number };
    firstExperience?: { experienceId?: number };
  } | undefined,
): Promise<string | undefined> {
  const sessionId = onboardingData?.practice?.sessionId;
  if (sessionId) {
    const [session] = await db
      .select({ id: practiceSessionsTable.id })
      .from(practiceSessionsTable)
      .where(
        and(
          eq(practiceSessionsTable.id, sessionId),
          eq(practiceSessionsTable.userId, userId),
        ),
      )
      .limit(1);
    if (!session) return "Practice session not found.";
  }

  const experienceId = onboardingData?.firstExperience?.experienceId;
  if (experienceId) {
    const [experience] = await db
      .select({ id: experiencesTable.id })
      .from(experiencesTable)
      .where(
        and(
          eq(experiencesTable.id, experienceId),
          eq(experiencesTable.userId, userId),
        ),
      )
      .limit(1);
    if (!experience) return "Experience not found.";
  }

  return undefined;
}

router.get("/practice/profile", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(authenticatedUserId(req));
  res.json(GetPracticeProfileResponse.parse(profile));
});

router.patch("/practice/profile", async (req, res): Promise<void> => {
  const parsed = UpdatePracticeProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid profile update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = authenticatedUserId(req);
  const referenceError = await validateOnboardingReferences(
    userId,
    parsed.data.onboardingData,
  );
  if (referenceError) {
    res.status(404).json({ error: referenceError });
    return;
  }

  const profile = await getOrCreateProfile(userId);
  const [updated] = await db
    .update(coachProfilesTable)
    .set(parsed.data)
    .where(and(eq(coachProfilesTable.id, profile.id), eq(coachProfilesTable.userId, userId)))
    .returning();

  res.json(UpdatePracticeProfileResponse.parse(updated));
});

router.get("/practice/experiences", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const experiences = await db
    .select()
    .from(experiencesTable)
    .where(eq(experiencesTable.userId, userId))
    .orderBy(desc(experiencesTable.createdAt));
  res.json(ListExperiencesResponse.parse(experiences));
});

router.post("/practice/experiences", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const parsed = CreateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid experience");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [experience] = await db
    .insert(experiencesTable)
    .values({ ...parsed.data, userId })
    .onConflictDoUpdate({
      target: [experiencesTable.userId, experiencesTable.clientRequestId],
      set: { clientRequestId: parsed.data.clientRequestId },
    })
    .returning();
  res.status(201).json(CreateExperienceResponse.parse(experience));
});

router.get("/practice/sessions", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const sessions = await db
    .select()
    .from(practiceSessionsTable)
    .where(eq(practiceSessionsTable.userId, userId))
    .orderBy(desc(practiceSessionsTable.createdAt));
  res.json(ListPracticeSessionsResponse.parse(sessions));
});

router.post("/practice/sessions", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const parsed = CreatePracticeSessionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid practice session");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(practiceSessionsTable)
    .values({
      ...parsed.data,
      userId,
      completedAt: new Date(),
    })
    .returning();
  res.status(201).json(CreatePracticeSessionResponse.parse(session));
});

router.get("/practice/overview", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req);
  const profile = await getOrCreateProfile(userId);
  const [experiences, sessions, assets] = await Promise.all([
    db.select().from(experiencesTable).where(eq(experiencesTable.userId, userId)).orderBy(desc(experiencesTable.createdAt)),
    db
      .select()
      .from(practiceSessionsTable)
      .where(eq(practiceSessionsTable.userId, userId))
      .orderBy(desc(practiceSessionsTable.createdAt)),
    db.select().from(knowledgeAssetsTable).where(eq(knowledgeAssetsTable.userId, userId)).orderBy(desc(knowledgeAssetsTable.createdAt)),
  ]);

  const activity = [
    ...experiences.slice(0, 3).map((experience) => ({
      id: `experience-${experience.id}`,
      title: experience.title,
      detail: experience.principle,
      kind: "Experience",
      createdAt: experience.createdAt,
    })),
    ...sessions.slice(0, 3).map((session) => ({
      id: `session-${session.id}`,
      title: session.scenario,
      detail: session.feedback ?? "Practice completed",
      kind: "Practice",
      createdAt: session.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);
  const ratings = profile.onboardingData.skillRatings;
  const skills = [
    ["Questioning", ratings?.questioning],
    ["Listening", ratings?.listening],
    ["Reframing", ratings?.reframing],
    ["Challenging", ratings?.challenging],
  ].map(([name, rating], index) => ({
    name: String(name),
    score: typeof rating === "number" ? rating * 10 : [82, 76, 61, 58][index]!,
    trend: typeof rating === "number" ? "Self-assessed" : ["Improving", "Steady", "Developing", "Priority"][index]!,
  }));
  const primaryGoal = profile.onboardingData.goals?.primaryGoal ?? profile.goal;
  const firstBuild = profile.onboardingData.build?.firstBuild?.title;

  res.json(
    GetPracticeOverviewResponse.parse({
      profile,
      experienceCount: experiences.length,
      lessonCount: experiences.length,
      principleCount: experiences.filter((item) => item.principle.length > 0).length,
      frameworkCount: assets.filter((asset) => asset.type === "framework").length,
      ipAssetCount: assets.length,
      practiceSessionCount: sessions.length,
       skills,
      jobs: [
        {
          id: "practice-resistance",
          kind: "Practice",
          title: "Resistance drill",
          description: `Practice toward ${primaryGoal}.`,
          duration: "10 min",
        },
        {
          id: "reflect-experience",
          kind: "Reflect",
          title: "Capture one live moment",
          description: "Turn a recent client moment into a reusable lesson.",
          duration: "8 min",
        },
        {
          id: "build-framework",
          kind: "Build",
          title: firstBuild ?? "Advance one principle",
          description: firstBuild
            ? "Move your first onboarding build forward."
            : "Connect a validated principle to your signature method.",
          duration: "15 min",
        },
      ],
      recentActivity: activity,
    }),
  );
});

export default router;