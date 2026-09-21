import {z} from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2).max(150),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    departementId: z.number().int().positive().optional(),
    positionId: z.number().int().positive().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;