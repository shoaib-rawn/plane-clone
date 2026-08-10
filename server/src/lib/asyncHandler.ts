// server/src/lib/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Higher-Order Function to wrap async Express route handlers/controllers.
 * Catches any uncaught Promise rejections and forwards them to Express next() error handler.
 * Eliminates repetitive try-catch blocks across all controllers.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
