import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { and, eq } from "drizzle-orm";
import {
  coachProfilesTable,
  db,
  experiencesTable,
  intelligenceRateLimitsTable,
  knowledgeAssetsTable,
  practiceSessionsTable,
} from "@workspace/db";
import router from "../src/routes/index.ts";

type TestRequest = {
  method?: "GET" | "PATCH" | "POST";
  body?: unknown;
  userId?: string;
};

function createAuthenticatedPracticeApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-clerk-user-id");
    // This is the Clerk request-auth shape that getAuth verifies, so routes
    // exercise the real requireAuth middleware without a Clerk network call.
    const auth = Object.assign(
      () => ({
        tokenType: "session_token" as const,
        userId: userId ?? null,
        sessionClaims: userId ? { userId } : null,
      }),
      { [Symbol.for("@clerk/express.auth")]: true },
    );
    (req as Request & { auth: typeof auth }).auth = auth;
    next();
  });
  app.use(router);
  return app;
}

async function startServer() {
  const server = createServer(createAuthenticatedPracticeApp());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;

  return {
    request: async (path: string, options: TestRequest = {}) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body === undefined
            ? {}
            : { "content-type": "application/json" }),
          ...(options.userId
            ? { "x-test-clerk-user-id": options.userId }
            : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      return { status: response.status, body: await response.json() };
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

test("Practice APIs reject anonymous access and isolate every user-owned resource", async () => {
  const testId = randomUUID();
  const aliceId = `practice-isolation-alice-${testId}`;
  const bobId = `practice-isolation-bob-${testId}`;
  const server = await startServer();

  try {
    const [aliceExperience] = await db
      .insert(experiencesTable)
      .values({
        userId: aliceId,
        clientRequestId: `alice-seed-${testId}`,
        title: "Alice private experience",
        situation: "Alice situation",
        learning: "Alice learning",
        principle: "Alice principle",
      })
      .returning();
    const [bobExperience] = await db
      .insert(experiencesTable)
      .values({
        userId: bobId,
        clientRequestId: `bob-seed-${testId}`,
        title: "Bob private experience",
        situation: "Bob situation",
        learning: "Bob learning",
        principle: "Bob principle",
      })
      .returning();
    await db.insert(coachProfilesTable).values([
      { userId: aliceId, name: "Alice private profile" },
      { userId: bobId, name: "Bob private profile" },
    ]);
    await db.insert(practiceSessionsTable).values([
      {
        userId: aliceId,
        scenario: "Alice private session",
        category: "Questioning",
        score: 80,
        feedback: "Alice feedback",
      },
      {
        userId: bobId,
        scenario: "Bob private session",
        category: "Listening",
        score: 90,
        feedback: "Bob feedback",
      },
    ]);
    await db.insert(knowledgeAssetsTable).values([
      {
        userId: aliceId,
        sourceExperienceId: aliceExperience!.id,
        type: "framework",
        title: "Alice private asset",
        content: "Alice content",
        promptStrategy: "Alice strategy",
      },
      {
        userId: bobId,
        sourceExperienceId: bobExperience!.id,
        type: "framework",
        title: "Bob private asset",
        content: "Bob content",
        promptStrategy: "Bob strategy",
      },
    ]);

    const anonymousRequests: Array<[string, TestRequest]> = [
      ["/practice/profile", {}],
      ["/practice/profile", { method: "PATCH", body: { name: "No account" } }],
      ["/practice/experiences", {}],
      [
        "/practice/experiences",
        {
          method: "POST",
          body: {
            clientRequestId: `anonymous-experience-${testId}`,
            title: "No account",
            situation: "No account",
            learning: "No account",
            principle: "No account",
          },
        },
      ],
      ["/practice/sessions", {}],
      [
        "/practice/sessions",
        {
          method: "POST",
          body: {
            scenario: "No account",
            category: "Questioning",
            score: 1,
            feedback: "No account",
          },
        },
      ],
      ["/practice/overview", {}],
      ["/practice/assets", {}],
      ["/practice/ai/simulate", { method: "POST", body: {} }],
      ["/practice/ai/extract", { method: "POST", body: {} }],
      ["/practice/ai/generate", { method: "POST", body: {} }],
      ["/practice/ai/next-action", { method: "POST", body: {} }],
    ];
    for (const [path, options] of anonymousRequests) {
      const result = await server.request(path, options);
      assert.equal(result.status, 401, `${options.method ?? "GET"} ${path}`);
      assert.deepEqual(result.body, { error: "Unauthorized" });
    }

    const aliceProfile = await server.request("/practice/profile", {
      userId: aliceId,
    });
    assert.equal(aliceProfile.status, 200);
    assert.equal(aliceProfile.body.name, "Alice private profile");

    const profileUpdate = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: { name: "Alice updated profile", userId: bobId },
    });
    assert.equal(profileUpdate.status, 200);
    const [bobProfile] = await db
      .select()
      .from(coachProfilesTable)
      .where(eq(coachProfilesTable.userId, bobId));
    assert.equal(bobProfile!.name, "Bob private profile");

    const aliceExperiences = await server.request("/practice/experiences", {
      userId: aliceId,
    });
    assert.equal(aliceExperiences.status, 200);
    assert.deepEqual(
      aliceExperiences.body.map((experience: { title: string }) => experience.title),
      ["Alice private experience"],
    );

    const createdExperience = await server.request("/practice/experiences", {
      method: "POST",
      userId: aliceId,
      body: {
        userId: bobId,
        clientRequestId: `alice-create-${testId}`,
        title: "Alice created experience",
        situation: "Alice created situation",
        learning: "Alice created learning",
        principle: "Alice created principle",
      },
    });
    assert.equal(createdExperience.status, 201);
    const bobCreatedExperiences = await db
      .select()
      .from(experiencesTable)
      .where(
        and(
          eq(experiencesTable.userId, bobId),
          eq(experiencesTable.clientRequestId, `alice-create-${testId}`),
        ),
      );
    assert.equal(bobCreatedExperiences.length, 0);

    const aliceSessions = await server.request("/practice/sessions", {
      userId: aliceId,
    });
    assert.equal(aliceSessions.status, 200);
    assert.deepEqual(
      aliceSessions.body.map((session: { scenario: string }) => session.scenario),
      ["Alice private session"],
    );

    const createdSession = await server.request("/practice/sessions", {
      method: "POST",
      userId: aliceId,
      body: {
        userId: bobId,
        scenario: "Alice created session",
        category: "Challenge",
        score: 85,
        feedback: "Alice created feedback",
      },
    });
    assert.equal(createdSession.status, 201);
    const bobCreatedSessions = await db
      .select()
      .from(practiceSessionsTable)
      .where(
        and(
          eq(practiceSessionsTable.userId, bobId),
          eq(practiceSessionsTable.scenario, "Alice created session"),
        ),
      );
    assert.equal(bobCreatedSessions.length, 0);

    const aliceAssets = await server.request("/practice/assets", { userId: aliceId });
    assert.equal(aliceAssets.status, 200);
    assert.deepEqual(
      aliceAssets.body.map((asset: { title: string }) => asset.title),
      ["Alice private asset"],
    );

    const overview = await server.request("/practice/overview", { userId: aliceId });
    assert.equal(overview.status, 200);
    assert.equal(overview.body.profile.name, "Alice updated profile");
    assert.equal(overview.body.experienceCount, 2);
    assert.equal(overview.body.practiceSessionCount, 2);
    assert.equal(overview.body.ipAssetCount, 1);
    assert.equal(JSON.stringify(overview.body).includes("Bob private"), false);

    const otherAccountSource = await server.request("/practice/ai/generate", {
      method: "POST",
      userId: aliceId,
      body: {
        sourceExperienceId: bobExperience!.id,
        assetType: "framework",
        objective: "Attempt to access another account's source",
      },
    });
    assert.equal(otherAccountSource.status, 404);
    assert.deepEqual(otherAccountSource.body, {
      error: "Source experience not found.",
    });
  } finally {
    await server.close();
    await db.delete(intelligenceRateLimitsTable).where(
      eq(intelligenceRateLimitsTable.userId, aliceId),
    );
    await db.delete(knowledgeAssetsTable).where(
      eq(knowledgeAssetsTable.userId, aliceId),
    );
    await db.delete(knowledgeAssetsTable).where(
      eq(knowledgeAssetsTable.userId, bobId),
    );
    await db.delete(practiceSessionsTable).where(
      eq(practiceSessionsTable.userId, aliceId),
    );
    await db.delete(practiceSessionsTable).where(
      eq(practiceSessionsTable.userId, bobId),
    );
    await db.delete(experiencesTable).where(eq(experiencesTable.userId, aliceId));
    await db.delete(experiencesTable).where(eq(experiencesTable.userId, bobId));
    await db.delete(coachProfilesTable).where(
      eq(coachProfilesTable.userId, aliceId),
    );
    await db.delete(coachProfilesTable).where(
      eq(coachProfilesTable.userId, bobId),
    );
  }
});

test("Onboarding accepts all 15 steps, resumes JSON state, and protects linked records", async () => {
  const testId = randomUUID();
  const aliceId = `onboarding-alice-${testId}`;
  const bobId = `onboarding-bob-${testId}`;
  const server = await startServer();

  try {
    const initial = await server.request("/practice/profile", { userId: aliceId });
    assert.equal(initial.status, 200);
    assert.deepEqual(initial.body.onboardingData, {});

    const invalidStep = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: { onboardingStep: 16 },
    });
    assert.equal(invalidStep.status, 400);

    const bobSession = await server.request("/practice/sessions", {
      method: "POST",
      userId: bobId,
      body: {
        scenario: "Bob onboarding practice",
        category: "Questioning",
        score: 85,
        feedback: "Private session",
      },
    });
    assert.equal(bobSession.status, 201);

    const crossAccountReference = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: {
        onboardingStep: 6,
        onboardingData: { practice: { sessionId: bobSession.body.id } },
      },
    });
    assert.equal(crossAccountReference.status, 404);

    const ownSession = await server.request("/practice/sessions", {
      method: "POST",
      userId: aliceId,
      body: {
        clientRequestId: `alice-onboarding-practice-${testId}`,
        scenario: "Alice onboarding practice",
        category: "Questioning",
        score: 91,
        feedback: "Strong curiosity",
      },
    });
    assert.equal(ownSession.status, 201);

    const ownExperience = await server.request("/practice/experiences", {
      method: "POST",
      userId: aliceId,
      body: {
        clientRequestId: `alice-onboarding-experience-${testId}`,
        title: "Decision hesitation",
        situation: "A client hesitated over a decision.",
        learning: "Leave more silence.",
        principle: "Pause before advice.",
      },
    });
    assert.equal(ownExperience.status, 201);

    const onboardingData = {
      goals: {
        primaryGoal: "Build a durable coaching practice",
        outcomes: ["Become a better coach"],
      },
      profileDetails: {
        yearsCoaching: 3,
        currentStage: "Developing",
        coachingTypes: ["1:1"],
      },
      experienceDiscovery: {
        q1: "Decision making",
        q2: "Leadership transitions",
        q3: "Clarifying assumptions",
        q4: "Resistant client conversations",
      },
      skillRatings: {
        questioning: 5,
        listening: 4,
        reframing: 4,
        challenging: 3,
        accountability: 4,
        sessionStructure: 3,
        handlingResistance: 3,
        interventionSelection: 4,
        coachingJudgment: 4,
      },
      miniScenario: {
        choice: "Reflect the client's concern",
        evaluation: "Strong empathy",
        score: 90,
      },
      practice: { sessionId: ownSession.body.id, result: "completed" },
      development: {
        modes: ["Scenario simulations"],
        dailyTimeCommitment: "30",
      },
      brand: {
        discovery: {
          q1: "Clear decisions",
          q2: "Growth leaders",
          q3: "Decision paralysis",
          q4: "Reflective challenge",
          q5: "Silence creates insight",
          q6: "Leadership experience",
        },
        reviewState: "accepted",
      },
      methodology: {
        discovery: {
          q1: "Clarify the goal",
          q2: "Patterns",
          q3: "What matters now?",
          q4: "Client ownership",
          q5: "Patient inquiry",
          q6: "Premature advice",
        },
        candidates: [{ title: "Decision pause" }],
        reviewState: "keep",
      },
      build: {
        ambitions: ["Frameworks"],
        firstBuild: { type: "Framework", title: "Decision pause" },
      },
      firstExperience: {
        experienceId: ownExperience.body.id,
        captureState: "saved",
        whatHappened: "A client hesitated over a decision.",
        whoWasInvolved: "Coach and client",
        whatDidYouDo: "Asked a clarifying question.",
        whatWereYouThinking: "Slow the moment down.",
        whatWorked: "The client named the concern.",
        whatDidNotWork: "I rushed the close.",
        whatDidYouLearn: "Leave more silence.",
        whatWillYouDoDifferently: "Pause before reframing.",
      },
      experienceAnalysis: {
        experience: "Decision hesitation",
        lesson: "Name the underlying concern",
        principle: "Pause before advice",
        framework: "Decision pause",
        reviewState: "accepted",
      },
      firstChallenge: {
        sessionId: ownSession.body.id,
        completed: true,
        result: "completed",
        overallScore: 82,
        questioningScore: 90,
        listeningScore: 85,
        reframingScore: 75,
        challengingScore: 70,
        accountabilityScore: 80,
      },
      thirtyDayPlan: {
        sections: { practice: ["Practice daily"], reflection: ["Reflect weekly"] },
        accepted: true,
        customization: "Keep weekends open",
      },
      passport: { reviewed: true },
    };
    const invalidCompletion = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: {
        onboardingStep: 15,
        onboardingCompleted: true,
        onboardingData: { goals: { outcomes: ["Become a better coach"] } },
      },
    });
    assert.equal(invalidCompletion.status, 400);
    assert.match(invalidCompletion.body.error, /profileDetails/);

    const saved = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: { onboardingStep: 15, onboardingCompleted: true, onboardingData },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.onboardingStep, 15);
    assert.deepEqual(saved.body.onboardingData, onboardingData);

    const resumed = await server.request("/practice/profile", { userId: aliceId });
    assert.equal(resumed.status, 200);
    assert.equal(resumed.body.onboardingCompleted, true);
    assert.deepEqual(resumed.body.onboardingData, onboardingData);
  } finally {
    await server.close();
    await db.delete(practiceSessionsTable).where(eq(practiceSessionsTable.userId, aliceId));
    await db.delete(practiceSessionsTable).where(eq(practiceSessionsTable.userId, bobId));
    await db.delete(experiencesTable).where(eq(experiencesTable.userId, aliceId));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.userId, aliceId));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.userId, bobId));
  }
});

test("Profile onboarding patches recursively merge and validate merged references", async () => {
  const testId = randomUUID();
  const aliceId = `onboarding-merge-alice-${testId}`;
  const bobId = `onboarding-merge-bob-${testId}`;
  const server = await startServer();

  try {
    await server.request("/practice/profile", { userId: aliceId });
    const bobSession = await server.request("/practice/sessions", {
      method: "POST",
      userId: bobId,
      body: {
        clientRequestId: `bob-merged-reference-${testId}`,
        scenario: "Bob private retry",
        category: "Resistance",
        score: 77,
        feedback: "Private",
      },
    });
    assert.equal(bobSession.status, 201);

    const firstPatch = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: {
        onboardingData: {
          goals: {
            outcomes: ["Become a better coach", "Build a methodology"],
            motivations: ["Serve clients"],
          },
          profileDetails: { coachingTypes: ["1:1"], currentStage: "Developing" },
        },
      },
    });
    assert.equal(firstPatch.status, 200);

    const secondPatch = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: {
        onboardingData: {
          goals: { outcomes: ["Grow my coaching business"] },
          profileDetails: { yearsCoaching: 3 },
        },
      },
    });
    assert.equal(secondPatch.status, 200);
    assert.deepEqual(secondPatch.body.onboardingData.goals, {
      outcomes: ["Grow my coaching business"],
      motivations: ["Serve clients"],
    });
    assert.deepEqual(secondPatch.body.onboardingData.profileDetails, {
      coachingTypes: ["1:1"],
      currentStage: "Developing",
      yearsCoaching: 3,
    });

    const crossAccountMergedReference = await server.request("/practice/profile", {
      method: "PATCH",
      userId: aliceId,
      body: {
        onboardingData: {
          firstChallenge: {
            completed: true,
            sessionId: bobSession.body.id,
          },
        },
      },
    });
    assert.equal(crossAccountMergedReference.status, 404);

    const unchanged = await server.request("/practice/profile", { userId: aliceId });
    assert.equal(unchanged.body.onboardingData.firstChallenge, undefined);
    assert.deepEqual(unchanged.body.onboardingData.goals.outcomes, [
      "Grow my coaching business",
    ]);
  } finally {
    await server.close();
    await db.delete(practiceSessionsTable).where(eq(practiceSessionsTable.userId, bobId));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.userId, aliceId));
    await db.delete(coachProfilesTable).where(eq(coachProfilesTable.userId, bobId));
  }
});

test("Practice session creation is idempotent per user and client request", async () => {
  const testId = randomUUID();
  const aliceId = `session-idempotency-alice-${testId}`;
  const bobId = `session-idempotency-bob-${testId}`;
  const clientRequestId = `practice-session-${testId}`;
  const server = await startServer();

  try {
    const body = {
      clientRequestId,
      scenario: "Ambiguous save retry",
      category: "Questioning",
      score: 88,
      feedback: "Good pause",
    };
    const first = await server.request("/practice/sessions", {
      method: "POST",
      userId: aliceId,
      body,
    });
    const retry = await server.request("/practice/sessions", {
      method: "POST",
      userId: aliceId,
      body,
    });
    assert.equal(first.status, 201);
    assert.equal(retry.status, 201);
    assert.equal(retry.body.id, first.body.id);
    assert.equal(retry.body.clientRequestId, clientRequestId);

    const otherUser = await server.request("/practice/sessions", {
      method: "POST",
      userId: bobId,
      body,
    });
    assert.equal(otherUser.status, 201);
    assert.notEqual(otherUser.body.id, first.body.id);

    const aliceRows = await db
      .select()
      .from(practiceSessionsTable)
      .where(
        and(
          eq(practiceSessionsTable.userId, aliceId),
          eq(practiceSessionsTable.clientRequestId, clientRequestId),
        ),
      );
    assert.equal(aliceRows.length, 1);
  } finally {
    await server.close();
    await db.delete(practiceSessionsTable).where(eq(practiceSessionsTable.userId, aliceId));
    await db.delete(practiceSessionsTable).where(eq(practiceSessionsTable.userId, bobId));
  }
});