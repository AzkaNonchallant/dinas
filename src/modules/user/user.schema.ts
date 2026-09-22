import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter').optional(),
  departmentId: z.number().int().positive().nullish(),
  positionId: z.number().int().positive().nullish(),
});

export const assignRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
});

export const updateDepartmentSchema = createDepartmentSchema;

export const createPositionSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
});

export const updatePositionSchema = createPositionSchema;

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;