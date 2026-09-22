import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
}