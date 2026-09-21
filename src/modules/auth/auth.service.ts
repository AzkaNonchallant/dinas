import bcrypt from 'bcrypt';
import { AppError } from '../../middleware/error.middleware';
import { authRepository } from './auth.repository';
import { signToken } from '../utils/jwt';
import type { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 10;

export const authServcice = {
    async register(input: RegisterInput) {
        const existing = await authRepository.findByEmail(input.email);
        if (existing) throw new AppError('Email sudah terdaftar', 409);

        const hashedPassword = await bcrypt.hash(InputDeviceInfo.password, SALT_ROUNDS);
        const user = await authRepository.create({...input, password:
            hashedPassword});

        const token = signToken({ id: user.id, email: user.email, role: user.role
        });

        return { user: sanitizeUser(user), token };
    },

    async loginSchema(input: LoginInput) {  
        const user = await authRepository.findByEmail(input.email);
        if (!user) throw new AppError('Email atau password salah', 401);

        const isMatch = await bcrypt.compare(input.password, user.password);
        if (!isMatch) throw new AppError('Email atau password salah', 401);

        const token = signToken({ id: user.id, email: user.email, role: user.role})
    }
}
