import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../../config/index.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  if (err instanceof ZodError) {
    const messages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages,
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'A record with this value already exists',
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
  });
}
