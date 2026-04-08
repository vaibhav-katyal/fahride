import type { NextFunction, Request, Response } from "express";
import type { Express } from "express";
import { AppError } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role: "user" | "admin";
  };
  file?: Express.Multer.File;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const cookieToken = req.cookies?.accessToken || "";
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }
  return next();
};
