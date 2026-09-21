import { Request, Response, NextFunction} from 'express';
import { AppError } from './error.middleware';
import { JwtPayload } from 'jsonwebtoken';
import { verifyToken, JwtPayLoad } from '../utils/jwt';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')){
        return next(new AppError('Token tidak ditemukan', 401));
    }
}

export function requiredRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction)=> {
        if (!req.user) return next(new AppError('Belum terautentikasi', 401));
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError('Anda tidak memiliki akses untuk aksi ini', 403));
        }
        next();
    };
}