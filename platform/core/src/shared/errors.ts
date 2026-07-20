export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function conflict(code: string, message: string, details?: Record<string, unknown>): AppError {
  return new AppError(code, 409, message, details);
}

export function notFound(code: string, message: string): AppError {
  return new AppError(code, 404, message);
}

export function forbidden(code: string, message: string): AppError {
  return new AppError(code, 403, message);
}
