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
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth";

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

  res.json(
    GetPracticeOverviewResponse.parse({
      profile,
      experienceCount: experiences.length,
      lessonCount: experiences.length,
      principleCount: experiences.filter((item) => item.principle.length > 0).length,
      frameworkCount: assets.filter((asset) => asset.type === "framework").length,
      ipAssetCount: assets.length,
      practiceSessionCount: sessions.length,
      skills: [
        { name: "Questioning", score: 82, trend: "Improving" },
        { name: "Listening", score: 76, trend: "Steady" },
        { name: "Reframing", score: 61, trend: "Developing" },
        { name: "Challenge", score: 58, trend: "Priority" },
      ],
      jobs: [
        {
          id: "practice-resistance",
          kind: "Practice",
          title: "Resistance drill",
          description: "Coach an executive who challenges every question.",
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
          title: "Advance one principle",
          description: "Connect a validated principle to your signature method.",
          duration: "15 min",
        },
      ],
      recentActivity: activity,
    }),
  );
});

export default router;