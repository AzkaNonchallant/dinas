import bcrypt from 'bcrypt';
import { AppError } from '../../middleware/error.middleware';
import { signToken } from '../../utils/jwt';
import { sanitizeUser } from '../../utils/sanitize';
import { authRepository } from './auth.repository';
import type { LoginInput, RegisterInput } from './auth.schema';
import type { AuthResponse } from './auth.types';

const SALT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new AppError('Email sudah terdaftar', 409);

    await validateReferences(input);

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await authRepository.create({ ...input, password: hashedPassword });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return { user: sanitizeUser(user), token };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findByEmail(input.email);
    if (!user) throw new AppError('Email atau password salah', 401);
    if (!user.isActive) throw new AppError('Akun telah dinonaktifkan', 403);

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) throw new AppError('Email atau password salah', 401);

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return { user: sanitizeUser(user), token };
  },

  async getProfile(userId: number) {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User tidak ditemukan', 404);
    return sanitizeUser(user);
  },
};

async function validateReferences(input: RegisterInput) {
  if (input.departmentId) {
    const department = await authRepository.findDepartment(input.departmentId);
    if (!department) throw new AppError('Departemen tidak ditemukan', 400);
  }

  if (input.positionId) {
    const position = await authRepository.findPosition(input.positionId);
    if (!position) throw new AppError('Posisi tidak ditemukan', 400);
  }
}