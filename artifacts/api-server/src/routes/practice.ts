import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  coachProfilesTable,
  experiencesTable,
  knowledgeAssetsTable,
  practiceSessionsTable,
  type OnboardingData,
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
  onboardingData: OnboardingData | undefined,
  database: Pick<typeof db, "select"> = db,
): Promise<string | undefined> {
  const sessionIds = new Set(
    [
      onboardingData?.practice?.sessionId,
      onboardingData?.firstChallenge?.sessionId,
    ].filter((id): id is number => typeof id === "number"),
  );
  for (const sessionId of sessionIds) {
    const [session] = await database
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
    const [experience] = await database
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

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Recursively merges JSON objects while treating arrays and scalar values as
 * replacements. Neither input is mutated.
 */
function mergeOnboardingData(
  current: OnboardingData,
  patch: OnboardingData,
): OnboardingData {
  const merge = (
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
  ): Record<string, unknown> => {
    const result = { ...existing };
    for (const [key, value] of Object.entries(incoming)) {
      result[key] =
        isObject(value) && isObject(existing[key])
          ? merge(existing[key], value)
          : value;
    }
    return result;
  };

  return merge(current, patch) as OnboardingData;
}

const skillRatingKeys = [
  "listening",
  "questioning",
  "reframing",
  "challenging",
  "accountability",
  "sessionStructure",
  "handlingResistance",
  "interventionSelection",
  "coachingJudgment",
] as const;

const firstExperienceAnswerKeys = [
  "whatHappened",
  "whoWasInvolved",
  "whatDidYouDo",
  "whatWereYouThinking",
  "whatWorked",
  "whatDidNotWork",
  "whatDidYouLearn",
  "whatWillYouDoDifferently",
] as const;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnswers(
  value: Record<string, string | number | boolean | string[]> | undefined,
  keys: readonly string[],
): boolean {
  return Boolean(value && keys.every((key) => hasText(value[key])));
}

function validateCompletion(
  onboardingStep: number,
  onboardingData: OnboardingData,
): string | undefined {
  const missing: string[] = [];

  if (onboardingStep !== 15) missing.push("onboardingStep=15");
  if (!onboardingData.goals?.outcomes?.length) missing.push("goals");
  if (
    onboardingData.profileDetails?.yearsCoaching === undefined ||
    !hasText(onboardingData.profileDetails.currentStage) ||
    !onboardingData.profileDetails.coachingTypes?.length
  ) {
    missing.push("profileDetails");
  }
  if (
    !hasAnswers(onboardingData.experienceDiscovery, ["q1", "q2", "q3", "q4"])
  ) {
    missing.push("experienceDiscovery");
  }
  if (
    !onboardingData.skillRatings ||
    !skillRatingKeys.every(
      (key) => typeof onboardingData.skillRatings?.[key] === "number",
    )
  ) {
    missing.push("all skillRatings");
  }
  if (!hasText(onboardingData.miniScenario?.choice)) missing.push("miniScenario");
  if (
    !onboardingData.development?.modes?.length ||
    (onboardingData.development.minutesPerWeek === undefined &&
      onboardingData.development.dailyTimeCommitment === undefined)
  ) {
    missing.push("development");
  }
  if (
    !hasAnswers(onboardingData.brand?.discovery, [
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
    ]) ||
    !["reviewed", "accepted", "editing", "rejected"].includes(
      onboardingData.brand?.reviewState ?? "",
    )
  ) {
    missing.push("brand review");
  }
  if (
    !hasAnswers(onboardingData.methodology?.discovery, [
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
    ]) ||
    !["keep", "edit", "discard"].includes(
      onboardingData.methodology?.reviewState ?? "",
    )
  ) {
    missing.push("methodology review");
  }
  if (
    !onboardingData.build?.ambitions?.length ||
    !hasText(onboardingData.build.firstBuild?.type)
  ) {
    missing.push("build");
  }
  if (
    onboardingData.firstExperience?.captureState !== "saved" ||
    !onboardingData.firstExperience.experienceId ||
    !firstExperienceAnswerKeys.every((key) =>
      hasText(onboardingData.firstExperience?.[key]),
    )
  ) {
    missing.push("firstExperience");
  }
  if (
    !["reviewed", "accepted", "editing", "rejected"].includes(
      onboardingData.experienceAnalysis?.reviewState ?? "",
    )
  ) {
    missing.push("experienceAnalysis review");
  }
  if (
    onboardingData.firstChallenge?.completed !== true ||
    !onboardingData.firstChallenge.sessionId
  ) {
    missing.push("completed firstChallenge");
  }
  if (onboardingData.thirtyDayPlan?.accepted === undefined) {
    missing.push("thirtyDayPlan decision");
  }
  if (onboardingData.passport?.reviewed !== true) {
    missing.push("passport review");
  }

  return missing.length
    ? `Onboarding cannot be completed; missing or invalid: ${missing.join(", ")}.`
    : undefined;
}

router.get("/practice/profile", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(authenticatedUserId(req));
  res.json(GetPracticeProfileResponse.parse(profile));
});

router.patch("/practice/profile", async (req, res): Promise<void> => {
  const parsed = UpdatePracticeProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log?.warn({ errors: parsed.error.message }, "Invalid profile update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = authenticatedUserId(req);
  await getOrCreateProfile(userId);

  const result = await db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(coachProfilesTable)
      .where(eq(coachProfilesTable.userId, userId))
      .limit(1)
      .for("update");
    if (!profile) throw new Error("Unable to load the coach profile.");

    const onboardingData = parsed.data.onboardingData
      ? mergeOnboardingData(profile.onboardingData, parsed.data.onboardingData)
      : profile.onboardingData;
    const onboardingStep = parsed.data.onboardingStep ?? profile.onboardingStep;
    const onboardingCompleted =
      parsed.data.onboardingCompleted ?? profile.onboardingCompleted;

    const referenceError = await validateOnboardingReferences(
      userId,
      onboardingData,
      tx,
    );
    if (referenceError) return { status: 404 as const, error: referenceError };

    if (onboardingCompleted) {
      const completionError = validateCompletion(onboardingStep, onboardingData);
      if (completionError) {
        return { status: 400 as const, error: completionError };
      }
    }

    const [updated] = await tx
      .update(coachProfilesTable)
      .set({ ...parsed.data, onboardingData })
      .where(
        and(
          eq(coachProfilesTable.id, profile.id),
          eq(coachProfilesTable.userId, userId),
        ),
      )
      .returning();
    if (!updated) throw new Error("Unable to update the coach profile.");
    return { status: 200 as const, profile: updated };
  });

  if (result.status !== 200) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(UpdatePracticeProfileResponse.parse(result.profile));
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
    .onConflictDoUpdate({
      target: [
        practiceSessionsTable.userId,
        practiceSessionsTable.clientRequestId,
      ],
      set: {
        clientRequestId:
          "clientRequestId" in parsed.data
            ? (parsed.data.clientRequestId as string)
            : null,
      },
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