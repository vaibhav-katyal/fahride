import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the actual error for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
    if (err instanceof Error) {
      console.error("   Stack:", err.stack);
    }
  }

  const appError = err instanceof AppError ? err : new AppError("Internal server error", 500);

  const statusCode = appError.statusCode || 500;
  const payload = {
    success: false,
    message: appError.message,
    ...(appError.code ? { code: appError.code } : {}),
    ...(process.env.NODE_ENV !== "production" ? { stack: appError.stack } : {}),
  };

  res.status(statusCode).json(payload);
};
