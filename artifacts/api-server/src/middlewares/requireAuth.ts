import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export function authenticatedUserId(req: Request): string {
  const auth = getAuth(req);
  const claimUserId = auth.sessionClaims?.userId;
  const userId = typeof claimUserId === "string" ? claimUserId : auth.userId;

  if (!userId) {
    throw new Error("Authenticated route did not receive a Clerk user ID.");
  }

  return userId;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const claimUserId = auth.sessionClaims?.userId;
  const userId = typeof claimUserId === "string" ? claimUserId : auth.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

export function requireOperator(req: Request, res: Response, next: NextFunction) {
  const claims = getAuth(req).sessionClaims as
    | (Record<string, unknown> & {
        metadata?: Record<string, unknown>;
        public_metadata?: Record<string, unknown>;
        publicMetadata?: Record<string, unknown>;
      })
    | null
    | undefined;
  const role =
    claims?.role ??
    claims?.metadata?.role ??
    claims?.public_metadata?.role ??
    claims?.publicMetadata?.role;

  if (role !== "operator" && role !== "admin") {
    res.status(403).json({ error: "Operator access required" });
    return;
  }

  next();
}