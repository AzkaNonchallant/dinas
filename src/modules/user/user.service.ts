import { Prisma } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { sanitizeUser } from '../../utils/sanitize';
import { departmentRepository, positionRepository, userRepository } from './user.repository';
import type { AssignRoleInput, ListUsersQuery, UpdateUserInput } from './user.schema';

export const userService = {
  async list(query: ListUsersQuery) {
    const { items, total, page, limit } = await userRepository.findAll(query);
    return {
      data: items.map((item) => sanitizeUser(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User tidak ditemukan', 404);
    return sanitizeUser(user);
  },

  async update(id: number, input: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    await validateReferences(input);

    const updated = await userRepository.update(id, input);
    return sanitizeUser(updated);
  },

  async assignRole(id: number, input: AssignRoleInput) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    const updated = await userRepository.updateRole(id, input.role);
    return sanitizeUser(updated);
  },

  async deactivate(id: number) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    try {
      const updated = await userRepository.deactivate(id);
      return sanitizeUser(updated);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new AppError('User tidak dapat dinonaktifkan karena memiliki data terkait', 400);
      }
      throw err;
    }
  },
};

async function validateReferences(input: Pick<UpdateUserInput, 'departmentId' | 'positionId'>) {
  if (input.departmentId) {
    const department = await departmentRepository.findById(input.departmentId);
    if (!department) throw new AppError('Departemen tidak ditemukan', 400);
  }

  if (input.positionId) {
    const position = await positionRepository.findById(input.positionId);
    if (!position) throw new AppError('Posisi tidak ditemukan', 400);
  }
}

export const departmentService = {
  async list() {
    return departmentRepository.list();
  },

  async getById(id: number) {
    const department = await departmentRepository.findById(id);
    if (!department) throw new AppError('Departemen tidak ditemukan', 404);
    return department;
  },

  async create(name: string) {
    return departmentRepository.create(name);
  },

  async update(id: number, name: string) {
    await this.getById(id);
    return departmentRepository.update(id, name);
  },

  async remove(id: number) {
    const department = await departmentRepository.findById(id);
    if (!department) throw new AppError('Departemen tidak ditemukan', 404);

    try {
      await departmentRepository.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new AppError('Departemen tidak dapat dihapus karena masih memiliki user', 400);
      }
      throw err;
    }
  },
};

export const positionService = {
  async list() {
    return positionRepository.list();
  },

  async getById(id: number) {
    const position = await positionRepository.findById(id);
    if (!position) throw new AppError('Jabatan tidak ditemukan', 404);
    return position;
  },

  async create(name: string) {
    return positionRepository.create(name);
  },

  async update(id: number, name: string) {
    await this.getById(id);
    return positionRepository.update(id, name);
  },

  async remove(id: number) {
    const position = await positionRepository.findById(id);
    if (!position) throw new AppError('Jabatan tidak ditemukan', 404);

    try {
      await positionRepository.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new AppError('Position tidak dapat dihapus karena masih memiliki user', 400);
      }
      throw err;
    }
  },
};