import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import {
  db,
  coachProfilesTable,
  experiencesTable,
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

const router: IRouter = Router();

async function getOrCreateProfile() {
  const [existing] = await db.select().from(coachProfilesTable).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(coachProfilesTable)
    .values({
      name: "Coach",
      niche: "Leadership & Business Coaching",
      experienceLevel: "Developing coach",
      audience: "Growth-stage leaders navigating major transitions",
      goal: "Become a better coach",
      developmentFocus: "Questioning under resistance",
    })
    .returning();
  return created;
}

router.get("/practice/profile", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json(GetPracticeProfileResponse.parse(profile));
});

router.patch("/practice/profile", async (req, res): Promise<void> => {
  const parsed = UpdatePracticeProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid profile update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await getOrCreateProfile();
  const [updated] = await db
    .update(coachProfilesTable)
    .set(parsed.data)
    .where(sql`${coachProfilesTable.id} = ${profile.id}`)
    .returning();

  res.json(UpdatePracticeProfileResponse.parse(updated));
});

router.get("/practice/experiences", async (_req, res): Promise<void> => {
  const experiences = await db
    .select()
    .from(experiencesTable)
    .orderBy(desc(experiencesTable.createdAt));
  res.json(ListExperiencesResponse.parse(experiences));
});

router.post("/practice/experiences", async (req, res): Promise<void> => {
  const parsed = CreateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid experience");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [experience] = await db
    .insert(experiencesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(CreateExperienceResponse.parse(experience));
});

router.get("/practice/sessions", async (_req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(practiceSessionsTable)
    .orderBy(desc(practiceSessionsTable.createdAt));
  res.json(ListPracticeSessionsResponse.parse(sessions));
});

router.post("/practice/sessions", async (req, res): Promise<void> => {
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
      completedAt: new Date(),
    })
    .returning();
  res.status(201).json(CreatePracticeSessionResponse.parse(session));
});

router.get("/practice/overview", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  const [experiences, sessions] = await Promise.all([
    db.select().from(experiencesTable).orderBy(desc(experiencesTable.createdAt)),
    db
      .select()
      .from(practiceSessionsTable)
      .orderBy(desc(practiceSessionsTable.createdAt)),
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
      frameworkCount: Math.max(1, Math.floor(experiences.length / 2)),
      ipAssetCount: experiences.length * 2 + sessions.length,
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