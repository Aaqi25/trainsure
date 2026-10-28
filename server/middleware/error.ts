import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const isDev = process.env.NODE_ENV !== 'production';

  // Handle CORS policy error
  if (err.message && err.message.includes('CORS policy')) {
    statusCode = 403;
    errorCode = 'CORS_ERROR';
  }

  // Handle malformed JSON body
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
  }

  // Always log unexpected internal server errors
  if (statusCode >= 500) {
    console.error('[TrainSure Server Error]', err);
  }

  // In production, do not expose internal crash details for 500s
  const message =
    statusCode >= 500 && !isDev && !(err instanceof AppError)
      ? 'An unexpected internal error occurred'
      : err.message || 'An unexpected internal error occurred';

  const response: Record<string, any> = {
    success: false,
    message,
    error: errorCode,
  };

  // Include stack trace only in development
  if (isDev && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
