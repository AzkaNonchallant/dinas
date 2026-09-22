import { prisma } from '../../config/database';
import type { RegisterInput } from './auth.schema';

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { Department: true, Position: true },
    });
  },

  findDepartment(id: number) {
    return prisma.department.findUnique({ where: { id } });
  },

  findPosition(id: number) {
    return prisma.position.findUnique({ where: { id } });
  },

  create(data: RegisterInput & { password: string }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.positionId !== undefined ? { positionId: data.positionId } : {}),
      },
    });
  },
};