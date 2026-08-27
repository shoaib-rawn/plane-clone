// server/src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const NotFoundError = (message = 'Not found') =>
  new AppError(404, 'NOT_FOUND', message);

export const ForbiddenError = (message = 'Forbidden') =>
  new AppError(403, 'FORBIDDEN', message);

export const ConflictError = (message: string, code = 'CONFLICT') =>
  new AppError(409, code, message);

export const UnauthorizedError = (message = 'Unauthorized', code = 'TOKEN_INVALID') =>
  new AppError(401, code, message);

export const BadRequestError = (message = 'Bad request', code = 'BAD_REQUEST') =>
  new AppError(400, code, message);

export const UnprocessableError = (message: string, code = 'VALIDATION_ERROR', details?: unknown) =>
  new AppError(422, code, message, details);
