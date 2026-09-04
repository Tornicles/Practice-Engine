import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSeed, todayStamp } from "./seed";
import type {
  AppSettings,
  Coach,
  ContentItem,
  DeliverySession,
  EngineState,
  Experience,
  Investigation,
  MethodologyTest,
  Opportunity,
  PracticeSession,
  ReuseDest,
  ValidationStatus,
} from "./types";
import { uid } from "./utils";

type Actions = {
  hydrate: () => void;
  resetDemo: () => void;
  completeJob: (id: string) => void;
  addPractice: (session: Omit<PracticeSession, "id" | "createdAt">) => void;
  addDelivery: (session: Omit<DeliverySession, "id">) => void;
  addExperience: (exp: Omit<Experience, "id" | "createdAt">) => void;
  attachPrinciple: (experienceId: string, principleId: string) => void;
  attachContradiction: (principleId: string, experienceId: string) => void;
  setPrincipleStatus: (id: string, status: ValidationStatus) => void;
  setFrameworkStatus: (id: string, status: ValidationStatus) => void;
  versionFramework: (id: string, note: string) => void;
  addMethodologyTest: (test: Omit<MethodologyTest, "id" | "createdAt">) => void;
  reuseIP: (assetId: string, dest: ReuseDest) => void;
  addContent: (item: Omit<ContentItem, "id" | "createdAt">) => void;
  publishContent: (id: string) => void;
  addAudienceQuestion: (id: string, q: string) => void;
  moveOpportunity: (id: string, stage: Opportunity["stage"], reason?: string) => void;
  addOpportunity: (prospect: string, offerId: string) => void;
  addOfferFromFramework: (frameworkId: string) => void;
  setOfferStatus: (id: string, status: EngineState["offers"][number]["status"]) => void;
  updateInvestigation: (id: string, patch: Partial<Investigation>) => void;
  addProof: (claim: string, source: string) => void;
  verifyProof: (id: string) => void;
  addProductModule: (productId: string, title: string, objective: string) => void;
  setProductStatus: (id: string, status: EngineState["products"][number]["status"]) => void;
  logAi: (entry: Omit<EngineState["aiAudits"][number], "id" | "createdAt">) => void;
  addPrincipleCandidate: (statement: string, explanation: string, experienceId?: string) => void;
  sendMessage: (threadId: string, text: string) => void;
  markThreadRead: (threadId: string) => void;
  convertThreadToFollowUp: (threadId: string) => void;
  updateCoach: (patch: Partial<Coach>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

export const useEngine = create<EngineState & Actions>()(
  persist(
    (set, get) => ({
      ...createSeed(),
      hydrate: () => {
        const stamp = todayStamp();
        const seed = createSeed();
        const cur = get();
        const patch: Partial<EngineState> = { hydrated: true };
        if (cur.todayStamp !== stamp) {
          patch.todayStamp = stamp;
          patch.todayJobs = seed.todayJobs.map((j) => ({ ...j, done: false }));
        }
        if (!cur.methods?.length) patch.methods = seed.methods;
        if (!cur.protocols?.length) patch.protocols = seed.protocols;
        if (!cur.drills?.length) patch.drills = seed.drills;
        if (!cur.ipAssets?.length) patch.ipAssets = seed.ipAssets;
        if (!cur.methodologyTests?.length) patch.methodologyTests = seed.methodologyTests;
        if (!cur.pillars?.length) patch.pillars = seed.pillars;
        if (!cur.segments?.length) patch.segments = seed.segments;
        if (!cur.aiAudits) patch.aiAudits = seed.aiAudits;
        if (!cur.threads?.length) patch.threads = seed.threads;
        if (!cur.settings) patch.settings = seed.settings;
        if (!cur.brand?.tagline) {
          patch.brand = { ...seed.brand, ...cur.brand, tagline: cur.brand?.tagline || seed.brand.tagline };
        }
        set(patch);
      },
      resetDemo: () => set({ ...createSeed(), hydrated: true, todayStamp: todayStamp() }),
      completeJob: (id) =>
        set({
          todayJobs: get().todayJobs.map((j) => (j.id === id ? { ...j, done: true } : j)),
        }),
      addPractice: (session) => {
        const id = uid("pr");
        const createdAt = new Date().toISOString();
        const observations = (Object.entries(session.scores) as [string, number][])
          .filter(([k]) => k !== "overall")
          .map(([skill, score]) => ({
            id: uid("ob"),
            skill: skill as PracticeSession["skill"],
            score,
            sourceType: "simulation" as const,
            sourceId: id,
            note: session.weaknesses,
            createdAt,
          }));
        set({
          practices: [{ ...session, id, createdAt }, ...get().practices],
          observations: [...observations, ...get().observations],
          todayJobs: get().todayJobs.map((j) => (j.type === "practice" ? { ...j, done: true } : j)),
        });
      },
      addDelivery: (session) => {
        const id = uid("ds");
        set({ sessions: [{ ...session, id }, ...get().sessions] });
      },
      addExperience: (exp) => {
        const id = uid("ex");
        const createdAt = new Date().toISOString();
        set({
          experiences: [{ ...exp, id, createdAt }, ...get().experiences],
          todayJobs: get().todayJobs.map((j) => (j.type === "reflect" ? { ...j, done: true } : j)),
        });
      },
      attachPrinciple: (experienceId, principleId) => {
        set({
          experiences: get().experiences.map((e) =>
            e.id === experienceId ? { ...e, principleId } : e,
          ),
          principles: get().principles.map((p) =>
            p.id === principleId
              ? {
                  ...p,
                  experienceIds: p.experienceIds.includes(experienceId)
                    ? p.experienceIds
                    : [...p.experienceIds, experienceId],
                }
              : p,
          ),
          todayJobs: get().todayJobs.map((j) => (j.type === "build" ? { ...j, done: true } : j)),
        });
      },
      attachContradiction: (principleId, experienceId) => {
        set({
          principles: get().principles.map((p) =>
            p.id === principleId
              ? {
                  ...p,
                  contradictingIds: p.contradictingIds.includes(experienceId)
                    ? p.contradictingIds
                    : [...p.contradictingIds, experienceId],
                  validationStatus: "needs_revision",
                }
              : p,
          ),
        });
      },
      setPrincipleStatus: (id, status) =>
        set({
          principles: get().principles.map((p) => (p.id === id ? { ...p, validationStatus: status } : p)),
        }),
      setFrameworkStatus: (id, status) =>
        set({
          frameworks: get().frameworks.map((f) => (f.id === id ? { ...f, validationStatus: status } : f)),
          ipAssets: get().ipAssets.map((a) =>
            a.frameworkId === id ? { ...a, status } : a,
          ),
        }),
      versionFramework: (id, note) =>
        set({
          frameworks: get().frameworks.map((f) =>
            f.id === id
              ? { ...f, version: f.version + 1, changeNote: note, validationStatus: "testing" }
              : f,
          ),
          ipAssets: get().ipAssets.map((a) =>
            a.frameworkId === id ? { ...a, version: a.version + 1, status: "testing" } : a,
          ),
        }),
      addMethodologyTest: (test) => {
        set({
          methodologyTests: [
            { ...test, id: uid("mt"), createdAt: new Date().toISOString() },
            ...get().methodologyTests,
          ],
          todayJobs: get().todayJobs.map((j) => (j.type === "build" ? { ...j, done: true } : j)),
        });
      },
      reuseIP: (assetId, dest) => {
        const asset = get().ipAssets.find((a) => a.id === assetId);
        const fw = get().frameworks.find((f) => f.id === asset?.frameworkId);
        if (!asset) return;
        const reuse = asset.reuse.includes(dest) ? asset.reuse : [...asset.reuse, dest];
        const ipAssets = get().ipAssets.map((a) => (a.id === assetId ? { ...a, reuse } : a));
        if (dest === "content") {
          set({
            ipAssets,
            content: [
              {
                id: uid("ct"),
                title: asset.title,
                format: "post",
                kind: "educational",
                status: "draft",
                principleId: fw?.principleIds[0],
                message: `${asset.description}\n\nSource: ${asset.sourceLineage.join(" → ")}`,
                platform: "LinkedIn",
                questions: [],
                createdAt: new Date().toISOString(),
              },
              ...get().content,
            ],
          });
          return;
        }
        if (dest === "offer") {
          const status =
            fw && ["supported", "validated"].includes(fw.validationStatus) ? "testing" : "idea";
          set({
            ipAssets,
            offers: [
              {
                id: uid("of"),
                name: `${asset.title} offer`,
                type: "1:1 coaching",
                audience: get().brand.audience,
                problem: fw?.problem ?? get().brand.problem,
                promise: get().brand.promise,
                methodology: asset.title,
                frameworkId: asset.frameworkId,
                components: fw?.components ?? [],
                deliveryModel: "1:1",
                duration: "8 weeks",
                price: "TBD",
                status,
              },
              ...get().offers,
            ],
          });
          return;
        }
        if (dest === "course") {
          set({
            ipAssets,
            products: [
              {
                id: uid("pd"),
                name: `${asset.title} Lab`,
                type: "cohort",
                outcome: fw?.problem ? `Address: ${fw.problem}` : asset.description,
                methodology: asset.title,
                frameworkId: asset.frameworkId,
                modules: (fw?.components ?? []).map((c) => ({ title: c, objective: c })),
                status: "draft",
              },
              ...get().products,
            ],
          });
          return;
        }
        set({ ipAssets });
      },
      addContent: (item) =>
        set({
          content: [{ ...item, id: uid("ct"), createdAt: new Date().toISOString() }, ...get().content],
        }),
      publishContent: (id) =>
        set({
          content: get().content.map((c) => (c.id === id ? { ...c, status: "published" } : c)),
        }),
      addAudienceQuestion: (id, q) =>
        set({
          content: get().content.map((c) =>
            c.id === id ? { ...c, questions: [...c.questions, q] } : c,
          ),
        }),
      moveOpportunity: (id, stage, reason) =>
        set({
          opportunities: get().opportunities.map((o) =>
            o.id === id ? { ...o, stage, reason } : o,
          ),
        }),
      addOpportunity: (prospect, offerId) =>
        set({
          opportunities: [
            { id: uid("op"), offerId, prospect, stage: "lead", value: 8500 },
            ...get().opportunities,
          ],
        }),
      addOfferFromFramework: (frameworkId) => {
        const fw = get().frameworks.find((f) => f.id === frameworkId);
        if (!fw) return;
        const status = ["supported", "validated"].includes(fw.validationStatus) ? "testing" : "idea";
        set({
          offers: [
            {
              id: uid("of"),
              name: `${fw.name} engagement`,
              type: "1:1 coaching",
              audience: get().brand.audience,
              problem: fw.problem,
              promise: get().brand.promise,
              methodology: fw.name,
              frameworkId: fw.id,
              components: fw.components,
              deliveryModel: "1:1",
              duration: "8 weeks",
              price: "TBD",
              status,
            },
            ...get().offers,
          ],
        });
      },
      setOfferStatus: (id, status) => {
        const offer = get().offers.find((o) => o.id === id);
        const fw = get().frameworks.find((f) => f.id === offer?.frameworkId);
        if (status === "validated" && fw && !["supported", "validated"].includes(fw.validationStatus)) {
          set({
            offers: get().offers.map((o) => (o.id === id ? { ...o, status: "needs_revision" } : o)),
          });
          return;
        }
        set({
          offers: get().offers.map((o) => (o.id === id ? { ...o, status } : o)),
        });
      },
      updateInvestigation: (id, patch) =>
        set({
          investigations: get().investigations.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }),
      addProof: (claim, source) => {
        const id = uid("pf");
        const claims = get().brand.claims;
        const idx = claims.findIndex((c) => c.proofIds.length === 0);
        set({
          proofs: [
            { id, type: "case-study", claim, source, verificationStatus: "verified" },
            ...get().proofs,
          ],
          brand: {
            ...get().brand,
            claims:
              idx < 0
                ? claims
                : claims.map((c, i) => (i === idx ? { ...c, proofIds: [...c.proofIds, id] } : c)),
          },
        });
      },
      verifyProof: (id) =>
        set({
          proofs: get().proofs.map((p) =>
            p.id === id ? { ...p, verificationStatus: "verified" } : p,
          ),
        }),
      addProductModule: (productId, title, objective) =>
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, modules: [...p.modules, { title, objective }] } : p,
          ),
        }),
      setProductStatus: (id, status) => {
        const product = get().products.find((p) => p.id === id);
        const fw = get().frameworks.find((f) => f.id === product?.frameworkId);
        if (status === "validated" && fw && !["supported", "validated"].includes(fw.validationStatus)) {
          return;
        }
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, status } : p)),
        });
      },
      logAi: (entry) =>
        set({
          aiAudits: [
            { ...entry, id: uid("ai"), createdAt: new Date().toISOString() },
            ...get().aiAudits,
          ].slice(0, 20),
        }),
      addPrincipleCandidate: (statement, explanation, experienceId) => {
        const id = uid("prnc");
        set({
          principles: [
            {
              id,
              statement,
              explanation,
              experienceIds: experienceId ? [experienceId] : [],
              contradictingIds: [],
              validationStatus: "candidate",
              confidence: 0.3,
            },
            ...get().principles,
          ],
        });
      },
      sendMessage: (threadId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set({
          threads: get().threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  unread: 0,
                  messages: [
                    ...t.messages,
                    { id: uid("m"), from: "coach" as const, text: trimmed, at: new Date().toISOString() },
                  ],
                }
              : t,
          ),
        });
      },
      markThreadRead: (threadId) =>
        set({
          threads: get().threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
        }),
      convertThreadToFollowUp: (threadId) => {
        const thread = get().threads.find((t) => t.id === threadId);
        if (!thread) return;
        const last = thread.messages[thread.messages.length - 1];
        set({
          todayJobs: [
            {
              id: uid("job"),
              type: "reflect",
              title: `Follow up: ${thread.withName}`,
              detail: last?.text ?? thread.subject,
              href: "/messages",
              tab: "inbox",
              minutes: 8,
              done: false,
            },
            ...get().todayJobs,
          ],
        });
      },
      updateCoach: (patch) => set({ coach: { ...get().coach, ...patch } }),
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
    }),
    {
      name: "practice-engine-v3",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        coach: s.coach,
        objectives: s.objectives,
        observations: s.observations,
        practices: s.practices,
        clients: s.clients,
        sessions: s.sessions,
        experiences: s.experiences,
        principles: s.principles,
        methods: s.methods,
        frameworks: s.frameworks,
        protocols: s.protocols,
        drills: s.drills,
        ipAssets: s.ipAssets,
        methodologyTests: s.methodologyTests,
        brand: s.brand,
        proofs: s.proofs,
        pillars: s.pillars,
        segments: s.segments,
        content: s.content,
        offers: s.offers,
        opportunities: s.opportunities,
        products: s.products,
        investigations: s.investigations,
        todayJobs: s.todayJobs,
        todayStamp: s.todayStamp,
        aiAudits: s.aiAudits,
        threads: s.threads,
        settings: s.settings,
        hydrated: false,
      }),
    },
  ),
);
