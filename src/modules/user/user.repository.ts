import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import type { ListUsersQuery, UpdateUserInput } from './user.schema';

const includeRelations = {
  Department: true,
  Position: true,
} as const;

export const userRepository = {
  async findAll(query: ListUsersQuery) {
    const { page, limit, search, role, departmentId } = query;

    const where: Prisma.UserWhereInput = {
      ...(search
        ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
        : {}),
      ...(role ? { role } : {}),
      ...(departmentId ? { departmentId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  findDepartment(id: number) {
    return prisma.department.findUnique({ where: { id } });
  },

  findPosition(id: number) {
    return prisma.position.findUnique({ where: { id } });
  },

  update(id: number, data: UpdateUserInput) {
    const updates: Prisma.UserUncheckedUpdateInput = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.departmentId !== undefined) updates.departmentId = data.departmentId;
    if (data.positionId !== undefined) updates.positionId = data.positionId;
    return prisma.user.update({ where: { id }, data: updates });
  },

  updateRole(id: number, role: UserRole) {
    return prisma.user.update({ where: { id }, data: { role } });
  },

  deactivate(id: number) {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  },
};

export const departmentRepository = {
  list() {
    return prisma.department.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: number) {
    return prisma.department.findUnique({ where: { id } });
  },

  create(name: string) {
    return prisma.department.create({ data: { name } });
  },

  update(id: number, name: string) {
    return prisma.department.update({ where: { id }, data: { name } });
  },

  delete(id: number) {
    return prisma.department.delete({ where: { id } });
  },
};

export const positionRepository = {
  list() {
    return prisma.position.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: number) {
    return prisma.position.findUnique({ where: { id } });
  },

  create(name: string) {
    return prisma.position.create({ data: { name } });
  },

  update(id: number, name: string) {
    return prisma.position.update({ where: { id }, data: { name } });
  },

  delete(id: number) {
    return prisma.position.delete({ where: { id } });
  },
};