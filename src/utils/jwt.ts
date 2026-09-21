import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? 'id';

export interface JwtPayLoad {
    id: number;
    email: string;
    role: string
}

export function signToken(payload: JwtPayLoad): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN});
}

export function verifyToken(token: string): JwtPayLoad {
    return jwt.verify(token, JWT_SECRET) as JwtPayLoad;
}