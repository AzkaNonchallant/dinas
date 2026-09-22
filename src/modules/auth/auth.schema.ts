import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
  email: z.string().trim().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(100, 'Password maksimal 100 karakter'),
  departmentId: z.number().int().positive().nullish(),
  positionId: z.number().int().positive().nullish(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(100, 'Password maksimal 100 karakter'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;