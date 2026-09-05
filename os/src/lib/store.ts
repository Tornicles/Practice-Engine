import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_PROGRAM } from "./catalog";
import { createSeed, todayStamp } from "./seed";
import type {
  AppSettings,
  Client,
  ClientAction,
  Coach,
  ContentItem,
  DeliverySession,
  EngineState,
  Experience,
  Investigation,
  MessageThread,
  MethodologyTest,
  Opportunity,
  PracticeSession,
  ReuseDest,
  ValidationStatus,
} from "./types";
import { daysFromNow, uid } from "./utils";
import { WIP_CAP } from "./engine-loop";
import { clientProgramWeek, planNextWeek } from "./compute";
import type { PracticeEvent } from "./types";

function pushEvent(
  events: PracticeEvent[] | undefined,
  type: string,
  entityType: string,
  entityId: string,
): PracticeEvent[] {
  return [
    {
      id: uid("ev"),
      type,
      entityType,
      entityId,
      at: new Date().toISOString(),
    },
    ...(events ?? []),
  ].slice(0, 80);
}

function upsertCheckIn(
  threads: MessageThread[],
  client: Client,
  text: string,
): MessageThread[] {
  const existing = threads.find((t) => t.relatedClientId === client.id && t.kind === "checkin");
  const msg = { id: uid("m"), from: "coach" as const, text, at: new Date().toISOString() };
  const week = client.currentWeek ?? 1;
  if (existing) {
    return threads.map((t) =>
      t.id === existing.id
        ? {
            ...t,
            subject: `Check-in · week ${week}`,
            unread: 0,
            messages: [...t.messages, msg],
          }
        : t,
    );
  }
  return [
    {
      id: uid("th"),
      channel: "client",
      kind: "checkin",
      withName: client.name,
      withRole: client.role,
      unread: 0,
      priority: true,
      relatedClientId: client.id,
      subject: `Check-in · week ${week}`,
      messages: [msg],
    },
    ...threads,
  ];
}

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
  convertThreadToFollowUp: (threadId: string) => boolean;
  updateCoach: (patch: Partial<Coach>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  completeIntake: (clientId: string, patch: { objective: string; currentState: string }) => void;
  addClientAction: (clientId: string, text: string, due?: string, sourceSessionId?: string) => void;
  toggleClientAction: (clientId: string, actionId: string) => void;
  recordClientMetric: (clientId: string, metricId: string, value: number) => void;
  bookNextSession: (clientId: string, iso: string) => void;
  markPackagePaid: (clientId: string, paid: boolean) => void;
  sendCheckIn: (clientId: string, text?: string) => void;
  captureLessonFromSession: (sessionId: string) => string | null;
  closeWeek: () => boolean;
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
        if (!cur.events) patch.events = seed.events;
        if (
          cur.clients?.some(
            (c) =>
              c.metrics === undefined ||
              c.actions === undefined ||
              c.nextSessionAt === undefined ||
              c.currentWeek === undefined ||
              c.packagePaid === undefined,
          )
        ) {
          patch.clients = cur.clients.map((c) => {
            const seeded = seed.clients.find((s) => s.id === c.id);
            return {
              ...c,
              metrics: c.metrics ?? seeded?.metrics ?? [],
              actions: c.actions ?? seeded?.actions ?? [],
              remainingSessions: c.remainingSessions ?? seeded?.remainingSessions ?? 8,
              packageSessions: c.packageSessions ?? seeded?.packageSessions ?? 8,
              offerId: c.offerId ?? seeded?.offerId,
              nextSessionAt: c.nextSessionAt ?? seeded?.nextSessionAt,
              currentWeek: c.currentWeek ?? seeded?.currentWeek ?? 1,
              packagePaid: c.packagePaid ?? seeded?.packagePaid ?? false,
            };
          });
        }
        if (cur.offers?.some((o) => !o.program?.length)) {
          patch.offers = cur.offers.map((o) => {
            const seeded = seed.offers.find((s) => s.id === o.id);
            return { ...o, program: o.program?.length ? o.program : (seeded?.program ?? DEFAULT_PROGRAM) };
          });
        }
        if (cur.threads?.some((t) => t.kind === undefined)) {
          patch.threads = cur.threads.map((t) => ({
            ...t,
            kind: t.kind ?? (t.channel === "client" ? "checkin" : "conversation"),
          }));
        }
        if (cur.sessions?.some((s) => s.moments === undefined || s.coachSpeakPercent === undefined)) {
          patch.sessions = cur.sessions.map((s) => {
            const seeded = seed.sessions.find((x) => x.id === s.id);
            return {
              ...s,
              moments: s.moments ?? seeded?.moments ?? [],
              coachSpeakPercent: s.coachSpeakPercent ?? seeded?.coachSpeakPercent,
            };
          });
        }
        if (!cur.brand?.tagline) {
          patch.brand = { ...seed.brand, ...cur.brand, tagline: cur.brand?.tagline || seed.brand.tagline };
        }
        const clientsForWeek = patch.clients ?? cur.clients;
        if (clientsForWeek?.length) {
          const view = { ...cur, ...patch, clients: clientsForWeek, offers: patch.offers ?? cur.offers } as EngineState;
          const assigned = clientsForWeek.map((c) => {
            if (c.status !== "active") return c;
            const week = clientProgramWeek(view, c);
            if (!week) return c;
            if ((c.actions ?? []).some((a) => a.text === week.activity)) return c;
            return {
              ...c,
              actions: [{ id: uid("ca"), text: week.activity, due: `Week ${week.week}`, done: false }, ...(c.actions ?? [])],
            };
          });
          if (assigned.some((c, i) => c !== clientsForWeek[i])) patch.clients = assigned;
        }
        set(patch);
      },
      resetDemo: () => set({ ...createSeed(), hydrated: true, todayStamp: todayStamp() }),
      completeJob: (id) =>
        set({
          todayJobs: get().todayJobs.map((j) => (j.id === id ? { ...j, done: true } : j)),
          events: pushEvent(get().events, "JOB_COMPLETED", "job", id),
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
          events: pushEvent(get().events, "PRACTICE_COMPLETED", "practice", id),
        });
      },
      addDelivery: (session) => {
        const id = uid("ds");
        let threads = get().threads;
        const clients = get().clients.map((c) => {
          if (c.id !== session.clientId) return c;
          const remaining = Math.max(0, (c.remainingSessions ?? 8) - 1);
          const week = Math.min(c.packageSessions ?? 8, (c.currentWeek ?? 1) + 1);
          const action: ClientAction | null = session.followUp
            ? {
                id: uid("ca"),
                text: session.worksheet || session.followUp,
                due: "Before next session",
                done: false,
                sourceSessionId: id,
              }
            : null;
          const next: Client = {
            ...c,
            remainingSessions: remaining,
            currentWeek: week,
            nextSessionAt: c.nextSessionAt && new Date(c.nextSessionAt) > new Date() ? c.nextSessionAt : daysFromNow(7),
            actions: action ? [action, ...(c.actions ?? [])] : c.actions,
          };
          const checkInText = `After today's session: ${session.worksheet || session.followUp}. Reply before the next session.`;
          threads = upsertCheckIn(threads, next, checkInText);
          return next;
        });
        set({
          sessions: [{ ...session, id }, ...get().sessions],
          clients,
          threads,
          todayJobs: get().todayJobs.map((j) =>
            j.href === "/clients" && !j.done ? { ...j, done: true } : j,
          ),
          events: pushEvent(get().events, "SESSION_COMPLETED", "session", id),
        });
      },
      addExperience: (exp) => {
        const id = uid("ex");
        const createdAt = new Date().toISOString();
        set({
          experiences: [{ ...exp, id, createdAt }, ...get().experiences],
          todayJobs: get().todayJobs.map((j) => (j.type === "reflect" ? { ...j, done: true } : j)),
          events: pushEvent(get().events, "EXPERIENCE_CAPTURED", "experience", id),
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
                sessionCount: 8,
                program: DEFAULT_PROGRAM,
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
          events: pushEvent(get().events, "CONTENT_PUBLISHED", "content", id),
        }),
      addAudienceQuestion: (id, q) =>
        set({
          content: get().content.map((c) =>
            c.id === id ? { ...c, questions: [...c.questions, q] } : c,
          ),
        }),
      moveOpportunity: (id, stage, reason) => {
        const opp = get().opportunities.find((o) => o.id === id);
        if (!opp) return;
        if (stage === "won") {
          const existing = get().clients.find((c) => c.relatedOpportunityId === id || c.name === opp.prospect);
          const clientId = existing?.id ?? uid("cl");
          const offer = get().offers.find((o) => o.id === opp.offerId);
          const sessions = offer?.sessionCount ?? 8;
          const client = existing ?? {
            id: clientId,
            name: opp.prospect,
            role: "New client from sale",
            status: "new" as const,
            objective: "Intake not yet complete",
            currentState: "Won — starts as new, not active.",
            source: "sale" as const,
            relatedOpportunityId: id,
            offerId: opp.offerId,
            remainingSessions: sessions,
            packageSessions: sessions,
            metrics: [],
            actions: [],
            currentWeek: 1,
            packagePaid: true,
            nextSessionAt: daysFromNow(7),
          };
          let events = pushEvent(get().events, "SALE_WON", "opportunity", id);
          if (!existing) events = pushEvent(events, "CLIENT_CREATED", "client", clientId);
          set({
            opportunities: get().opportunities.map((o) =>
              o.id === id ? { ...o, stage, reason, clientId } : o,
            ),
            clients: existing ? get().clients : [client, ...get().clients],
            events,
          });
          return;
        }
        set({
          opportunities: get().opportunities.map((o) =>
            o.id === id ? { ...o, stage, reason } : o,
          ),
        });
      },
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
              sessionCount: 8,
              program: DEFAULT_PROGRAM,
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
        if (!thread) return false;
        const open = get().todayJobs.filter((j) => !j.done).length;
        if (open >= WIP_CAP) return false;
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
        return true;
      },
      updateCoach: (patch) => set({ coach: { ...get().coach, ...patch } }),
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      completeIntake: (clientId, patch) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  ...patch,
                  status: "active",
                  currentWeek: c.currentWeek ?? 1,
                  packagePaid: c.packagePaid ?? true,
                  nextSessionAt: c.nextSessionAt ?? daysFromNow(7),
                  metrics: c.metrics?.length
                    ? c.metrics
                    : [{ id: uid("m"), label: "Progress to goal", value: 0, target: 100, unit: "%" }],
                  actions: c.actions ?? [],
                }
              : c,
          ),
          events: pushEvent(get().events, "CLIENT_INTAKE", "client", clientId),
        }),
      addClientAction: (clientId, text, due = "This week", sourceSessionId) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  actions: [
                    { id: uid("ca"), text, due, done: false, sourceSessionId },
                    ...(c.actions ?? []),
                  ],
                }
              : c,
          ),
        }),
      toggleClientAction: (clientId, actionId) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  actions: (c.actions ?? []).map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)),
                }
              : c,
          ),
        }),
      recordClientMetric: (clientId, metricId, value) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  metrics: (c.metrics ?? []).map((m) => (m.id === metricId ? { ...m, value } : m)),
                }
              : c,
          ),
        }),
      bookNextSession: (clientId, iso) =>
        set({
          clients: get().clients.map((c) => (c.id === clientId ? { ...c, nextSessionAt: iso } : c)),
          events: pushEvent(get().events, "SESSION_BOOKED", "client", clientId),
        }),
      markPackagePaid: (clientId, paid) =>
        set({
          clients: get().clients.map((c) => (c.id === clientId ? { ...c, packagePaid: paid } : c)),
        }),
      sendCheckIn: (clientId, text) => {
        const client = get().clients.find((c) => c.id === clientId);
        if (!client) return;
        const open = (client.actions ?? []).find((a) => !a.done);
        const body =
          text?.trim() ||
          `Week ${client.currentWeek ?? 1} check-in: ${open?.text ?? "What moved since last session?"}`;
        set({
          threads: upsertCheckIn(get().threads, client, body),
          events: pushEvent(get().events, "CHECKIN_SENT", "client", clientId),
        });
      },
      captureLessonFromSession: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return null;
        const client = get().clients.find((c) => c.id === session.clientId);
        let experienceId = get().experiences.find(
          (e) =>
            e.sourceId === sessionId ||
            (e.sourceType === "session" && e.action === session.intervention && e.result === session.outcome),
        )?.id;
        let experiences = get().experiences;
        if (!experienceId) {
          experienceId = uid("ex");
          experiences = [
            {
              id: experienceId,
              title: `Session: ${session.objective.slice(0, 48)}`,
              sourceType: "session",
              sourceId: sessionId,
              situation: session.notes || session.objective,
              action: session.intervention,
              result: session.outcome,
              reflection: session.clientResponse,
              lesson: session.worksheet || session.outcome || session.objective,
              insight: (session.moments ?? []).join("; "),
              validationStatus: "raw",
              createdAt: new Date().toISOString(),
            },
            ...experiences,
          ];
        }
        const already = get().content.find((c) => c.sourceExperienceId === experienceId);
        if (already) {
          set({
            experiences,
            todayJobs: get().todayJobs.map((j) => (j.type === "build" ? { ...j, done: true } : j)),
          });
          return already.id;
        }
        const contentId = uid("ct");
        const lesson = session.worksheet || session.outcome || session.objective;
        set({
          experiences,
          content: [
            {
              id: contentId,
              title: lesson.slice(0, 72),
              format: "post",
              kind: "authority",
              status: "draft",
              sourceExperienceId: experienceId,
              message: `${lesson}\n\nFrom ${client?.name ?? "a live room"}: ${session.outcome}`,
              platform: "LinkedIn",
              questions: [],
              createdAt: new Date().toISOString(),
            },
            ...get().content,
          ],
          todayJobs: get().todayJobs.map((j) => (j.type === "build" ? { ...j, done: true } : j)),
          events: pushEvent(get().events, "LESSON_CAPTURED", "content", contentId),
        });
        return contentId;
      },
      closeWeek: () => {
        const state = get();
        if (state.todayJobs.some((j) => !j.done)) return false;
        const plan = planNextWeek(state);
        const jobs = plan.map((j) => ({ ...j, id: uid("job"), done: false }));
        const clients = state.clients.map((c) => {
          if (c.status !== "active") return c;
          const week = clientProgramWeek(state, c);
          if (!week) return c;
          if ((c.actions ?? []).some((a) => a.text === week.activity && !a.done)) return c;
          return {
            ...c,
            actions: [
              { id: uid("ca"), text: week.activity, due: `Week ${week.week}`, done: false },
              ...(c.actions ?? []),
            ],
          };
        });
        set({
          todayJobs: jobs,
          todayStamp: todayStamp(),
          weekClosedAt: new Date().toISOString(),
          clients,
          events: pushEvent(state.events, "WEEK_CLOSED", "week", todayStamp()),
        });
        return true;
      },
    }),
    {
      name: "practice-engine-v6",
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
        events: s.events,
        todayJobs: s.todayJobs,
        todayStamp: s.todayStamp,
        weekClosedAt: s.weekClosedAt,
        aiAudits: s.aiAudits,
        threads: s.threads,
        settings: s.settings,
        hydrated: false,
      }),
    },
  ),
);
