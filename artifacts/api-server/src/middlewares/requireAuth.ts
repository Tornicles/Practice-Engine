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