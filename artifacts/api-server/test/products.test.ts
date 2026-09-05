import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express, { type Request } from "express";
import { eq } from "drizzle-orm";
import {
  coachPassportsTable,
  coachProfilesTable,
  db,
  enrollmentsTable,
  eventsTable,
  lessonProgressTable,
  methodsTable,
  productLessonsTable,
  productModulesTable,
  productsTable,
} from "@workspace/db";
import router from "../src/routes/index.ts";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-clerk-user-id");
    const auth = Object.assign(
      () => ({ tokenType: "session_token" as const, userId: userId ?? null, sessionClaims: userId ? { userId } : null }),
      { [Symbol.for("@clerk/express.auth")]: true },
    );
    (req as Request & { auth: typeof auth }).auth = auth;
    next();
  });
  app.use(router);
  return app;
}

async function startServer() {
  const server = createServer(createApp());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;
  return {
    request: async (path: string, options: { method?: string; body?: unknown; userId?: string } = {}) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
          ...(options.userId ? { "x-test-clerk-user-id": options.userId } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

test("Courses cannot publish a draft method; learner completion does not change coach skills", async () => {
  const userId = `prod-${randomUUID()}`;
  const server = await startServer();
  try {
    const method = await server.request("/methods", { method: "POST", userId, body: { title: "Draft method" } });
    const blocked = await server.request("/products", {
      method: "POST",
      userId,
      body: { name: "Founder course", methodId: method.body.id, expectedOutput: "Named constraint" },
    });
    const published = await server.request(`/products/${blocked.body.product.id}/publish`, { method: "POST", userId });
    assert.equal(published.status, 409);

    const open = await server.request("/products", {
      method: "POST",
      userId,
      body: { name: "Open course", expectedOutput: "Named constraint" },
    });
    const ok = await server.request(`/products/${open.body.product.id}/publish`, { method: "POST", userId });
    assert.equal(ok.status, 200);
    const enrolled = await server.request(`/products/${open.body.product.id}/enrollments`, {
      method: "POST",
      userId,
      body: { learnerName: "Sam" },
    });
    const missing = await server.request(
      `/enrollments/${enrolled.body.id}/lessons/${open.body.lesson.id}/complete`,
      { method: "POST", userId, body: {} },
    );
    assert.equal(missing.status, 409);
    const done = await server.request(
      `/enrollments/${enrolled.body.id}/lessons/${open.body.lesson.id}/complete`,
      { method: "POST", userId, body: { output: "Named constraint" } },
    );
    assert.equal(done.status, 201);
    assert.equal(done.body.coachSkillCountUnchanged, true);
  } finally {
    await server.close();
    const [coach] = await db.select().from(coachProfilesTable).where(eq(coachProfilesTable.userId, userId));
    if (coach) {
      await db.delete(lessonProgressTable).where(eq(lessonProgressTable.enrollmentId, -1));
      const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.coachId, coach.id));
      for (const enrollment of enrollments) {
        await db.delete(lessonProgressTable).where(eq(lessonProgressTable.enrollmentId, enrollment.id));
      }
      await db.delete(enrollmentsTable).where(eq(enrollmentsTable.coachId, coach.id));
      const products = await db.select().from(productsTable).where(eq(productsTable.coachId, coach.id));
      for (const product of products) {
        const modules = await db.select().from(productModulesTable).where(eq(productModulesTable.productId, product.id));
        for (const module of modules) {
          await db.delete(productLessonsTable).where(eq(productLessonsTable.moduleId, module.id));
        }
        await db.delete(productModulesTable).where(eq(productModulesTable.productId, product.id));
      }
      await db.delete(productsTable).where(eq(productsTable.coachId, coach.id));
      await db.delete(methodsTable).where(eq(methodsTable.coachId, coach.id));
      await db.delete(eventsTable).where(eq(eventsTable.coachId, coach.id));
      await db.delete(coachPassportsTable).where(eq(coachPassportsTable.coachId, coach.id));
      await db.delete(coachProfilesTable).where(eq(coachProfilesTable.id, coach.id));
    }
  }
});
