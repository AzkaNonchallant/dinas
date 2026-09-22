import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { verifyToken, JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token tidak ditemukan', 401));
  }

  const token = header.split(' ')[1];
  if (!token) return next(new AppError('Token tidak valid', 401));

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Token tidak valid atau sudah kedaluwarsa', 401));
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Belum terautentikasi', 401));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Anda tidak memiliki akses untuk aksi ini', 403));
    }
    next();
  };
}