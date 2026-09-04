import type { RequestHandler } from "express";
import { db, intelligenceRateLimitsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticatedUserId } from "./requireAuth.ts";
import {
  engineFromAiPath,
  recordIntelligenceOperation,
} from "../lib/intelligence-operations.ts";
import { launchOperationalWrites } from "../lib/intelligence-operation-policy.ts";

export const intelligenceRateLimit: RequestHandler = async (req, res, next) => {
  try {
    const [window] = await db
      .insert(intelligenceRateLimitsTable)
      .values({ userId: authenticatedUserId(req) })
      .onConflictDoUpdate({
        target: intelligenceRateLimitsTable.userId,
        set: {
          requestCount: sql`case
            when ${intelligenceRateLimitsTable.windowStartedAt} <= now() - interval '10 minutes'
              then 1
            else ${intelligenceRateLimitsTable.requestCount} + 1
          end`,
          windowStartedAt: sql`case
            when ${intelligenceRateLimitsTable.windowStartedAt} <= now() - interval '10 minutes'
              then now()
            else ${intelligenceRateLimitsTable.windowStartedAt}
          end`,
        },
      })
      .returning();

    const remaining = Math.max(0, 12 - window.requestCount);
    res.setHeader("X-RateLimit-Limit", "12");
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (window.requestCount > 12) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (window.windowStartedAt.getTime() + 10 * 60 * 1000 - Date.now()) /
            1000,
        ),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      launchOperationalWrites(
        [
          {
            name: "rate-limit telemetry",
            run: () =>
              recordIntelligenceOperation({
                engine: engineFromAiPath(req.path),
                outcome: "rate-limit",
                failureClass: "application-rate-limit",
                startedAt: Date.now(),
              }),
          },
        ],
        (_name, error) =>
          req.log.error({ err: error }, "Rate-limit telemetry persistence failed"),
      );
      res.status(429).json({
        error:
          "The intelligence engine is receiving too many requests. Please try again shortly.",
      });
      return;
    }

    next();
  } catch (error) {
    req.log.error({ err: error }, "Intelligence rate limit check failed");
    res.status(503).json({
      error: "The intelligence engine is temporarily unavailable. Please try again.",
    });
  }
};