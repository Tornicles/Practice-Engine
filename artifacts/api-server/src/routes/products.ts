import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  enrollmentsTable,
  lessonProgressTable,
  methodsTable,
  productLessonsTable,
  productModulesTable,
  productsTable,
  skillStatesTable,
} from "@workspace/db";
import { authenticatedUserId, requireAuth } from "../middlewares/requireAuth.ts";
import { HttpError, appendAudit, ensurePassport } from "../lib/coach-foundation.ts";
import { appendEvent } from "../lib/events.ts";

const router: IRouter = Router();
router.use(requireAuth);

function sendError(res: { status: (n: number) => { json: (v: unknown) => void } }, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.extra });
    return;
  }
  throw error;
}

router.post("/products", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      name: z.string().min(3),
      methodId: z.number().optional(),
      moduleTitle: z.string().default("Module 1"),
      lessonTitle: z.string().default("Lesson 1"),
      expectedOutput: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const { coach } = await ensurePassport(authenticatedUserId(req));
    const [product] = await db.insert(productsTable).values({
      coachId: coach.id,
      name: parsed.data.name,
      methodId: parsed.data.methodId ?? null,
    }).returning();
    const [module] = await db.insert(productModulesTable).values({
      productId: product!.id,
      title: parsed.data.moduleTitle,
    }).returning();
    const [lesson] = await db.insert(productLessonsTable).values({
      moduleId: module!.id,
      title: parsed.data.lessonTitle,
      expectedOutput: parsed.data.expectedOutput ?? null,
    }).returning();
    res.status(201).json({ product, module, lesson });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/products/:id/publish", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [product] = await db.select().from(productsTable).where(and(
      eq(productsTable.id, Number(req.params.id)),
      eq(productsTable.coachId, coach.id),
    )).limit(1);
    if (!product) throw new HttpError(404, "NOT_FOUND", "Product not found.");
    const modules = await db.select().from(productModulesTable).where(eq(productModulesTable.productId, product.id));
    if (modules.length === 0) throw new HttpError(409, "INVALID_STATE_TRANSITION", "Publish requires at least one lesson.");
    const lessons = await db.select().from(productLessonsTable).where(eq(productLessonsTable.moduleId, modules[0]!.id));
    if (lessons.length === 0) throw new HttpError(409, "INVALID_STATE_TRANSITION", "Publish requires at least one lesson.");
    if (product.methodId) {
      const [method] = await db.select().from(methodsTable).where(eq(methodsTable.id, product.methodId)).limit(1);
      if (!method || !method.commercialEligible) {
        throw new HttpError(409, "INVALID_STATE_TRANSITION", "Cannot publish a course that teaches a draft method.");
      }
    }
    const [updated] = await db.update(productsTable).set({ status: "published" }).where(eq(productsTable.id, product.id)).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "PRODUCT_PUBLISHED",
      entityType: "product",
      entityId: String(product.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/products/:id/enrollments", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({
      learnerName: z.string().min(1),
      clientId: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION", message: parsed.error.message });
      return;
    }
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [product] = await db.select().from(productsTable).where(and(
      eq(productsTable.id, Number(req.params.id)),
      eq(productsTable.coachId, coach.id),
    )).limit(1);
    if (!product) throw new HttpError(404, "NOT_FOUND", "Product not found.");
    const [row] = await db.insert(enrollmentsTable).values({
      coachId: coach.id,
      productId: product.id,
      clientId: parsed.data.clientId ?? null,
      learnerName: parsed.data.learnerName,
      status: "active",
    }).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "ENROLLMENT_CREATED",
      entityType: "enrollment",
      entityId: String(row!.id),
    });
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/enrollments/:id/lessons/:lessonId/complete", async (req, res): Promise<void> => {
  try {
    const parsed = z.object({ output: z.string().optional() }).safeParse(req.body ?? {});
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [enrollment] = await db.select().from(enrollmentsTable).where(and(
      eq(enrollmentsTable.id, Number(req.params.id)),
      eq(enrollmentsTable.coachId, coach.id),
    )).limit(1);
    if (!enrollment) throw new HttpError(404, "NOT_FOUND", "Enrollment not found.");
    const [lesson] = await db.select().from(productLessonsTable).where(eq(productLessonsTable.id, Number(req.params.lessonId))).limit(1);
    if (!lesson) throw new HttpError(404, "NOT_FOUND", "Lesson not found.");
    if (lesson.expectedOutput && !parsed.data?.output) {
      throw new HttpError(409, "INVALID_STATE_TRANSITION", "Lesson complete requires the exercise output.");
    }
    const beforeSkills = await db.select().from(skillStatesTable).where(eq(skillStatesTable.coachId, coach.id));
    const [progress] = await db.insert(lessonProgressTable).values({
      enrollmentId: enrollment.id,
      lessonId: lesson.id,
      status: "completed",
      output: parsed.data?.output ?? null,
      completedAt: new Date(),
    }).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "LESSON_COMPLETED",
      entityType: "lesson_progress",
      entityId: String(progress!.id),
    });
    const afterSkills = await db.select().from(skillStatesTable).where(eq(skillStatesTable.coachId, coach.id));
    res.status(201).json({ progress, coachSkillCountUnchanged: beforeSkills.length === afterSkills.length });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/enrollments/:id/drop", async (req, res): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);
    const { coach } = await ensurePassport(userId);
    const [enrollment] = await db.select().from(enrollmentsTable).where(and(
      eq(enrollmentsTable.id, Number(req.params.id)),
      eq(enrollmentsTable.coachId, coach.id),
    )).limit(1);
    if (!enrollment) throw new HttpError(404, "NOT_FOUND", "Enrollment not found.");
    const [updated] = await db.update(enrollmentsTable).set({
      status: "dropped",
      droppedAt: new Date(),
    }).where(eq(enrollmentsTable.id, enrollment.id)).returning();
    await appendEvent({
      coachId: coach.id,
      userId,
      type: "ENROLLMENT_DROPPED",
      entityType: "enrollment",
      entityId: String(enrollment.id),
    });
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
