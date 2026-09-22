import fs from 'node:fs';
import path from 'node:path';
import { NotificationType, Prisma, TravelRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { APPROVAL_LEVEL_ROLES } from '../approval/approval.constants';
import { notificationService } from '../notification/notification.service';
import { uploadDir } from '../../utils/upload';
import { travelPolicyRepository } from './travel.policy.repository';
import { travelRepository } from './travel.repository';
import type { CreateTravelInput, ListTravelQuery, UpdateTravelInput } from './travel.schema';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRAVEL_ADMIN'];

const FINAL_TRAVEL_STATUSES: TravelRequestStatus[] = [
  TravelRequestStatus.APPROVED,
  TravelRequestStatus.CANCELLED,
  TravelRequestStatus.REJECTED,
  TravelRequestStatus.COMPLETED,
];

export async function canAccess(userId: number, role: string, travelId: number) {
  if (ADMIN_ROLES.includes(role)) return true;
  const count = await prisma.approval.count({ where: { travelId, approverId: userId } });
  return count > 0;
}

function buildAccessWhere(userId: number, role: string): Prisma.TravelRequestWhereInput {
  if (ADMIN_ROLES.includes(role)) return {};
  if (role === 'EMPLOYEE') return { userId };
  return { OR: [{ userId }, { approvals: { some: { approverId: userId } } }] };
}

export const travelService = {
  async list(userId: number, role: string, query: ListTravelQuery) {
    const where: Prisma.TravelRequestWhereInput = buildAccessWhere(userId, role);

    if (query.status) where.status = query.status;

    if (query.from || query.to) {
      const startDate: Prisma.DateTimeFilter = {};
      if (query.from) startDate.gte = query.from;
      if (query.to) startDate.lte = query.to;
      where.startDate = startDate;
    }

    const { items, total, page, limit } = await travelRepository.findAll(where, query);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(userId: number, role: string, id: number) {
    const travel = await travelRepository.findById(id);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId && !(await canAccess(userId, role, id))) {
      throw new AppError('Anda tidak memiliki akses ke pengajuan ini', 403);
    }
    return travel;
  },

  async create(userId: number, input: CreateTravelInput) {
    const policy = await travelPolicyRepository.findById(input.policyId);
    if (!policy) throw new AppError('Kebijakan travel tidak ditemukan', 400);
    return travelRepository.create(userId, input);
  },

  async update(userId: number, id: number, input: UpdateTravelInput) {
    const travel = await travelRepository.findById(id);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId) {
      throw new AppError('Hanya pemilik pengajuan yang dapat mengubah', 403);
    }
    if (travel.status !== TravelRequestStatus.DRAFT) {
      throw new AppError('Hanya pengajuan berstatus DRAFT yang dapat diubah', 400);
    }
    if (input.policyId) {
      const policy = await travelPolicyRepository.findById(input.policyId);
      if (!policy) throw new AppError('Kebijakan travel tidak ditemukan', 400);
    }
    return travelRepository.update(id, input);
  },

  async remove(userId: number, id: number) {
    const travel = await travelRepository.findById(id);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId) {
      throw new AppError('Hanya pemilik pengajuan yang dapat menghapus', 403);
    }
    if (travel.status !== TravelRequestStatus.DRAFT) {
      throw new AppError('Hanya pengajuan berstatus DRAFT yang dapat dihapus', 400);
    }
    await travelRepository.remove(id);
  },

  async submit(userId: number, id: number) {
    const travel = await travelRepository.findById(id);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId) {
      throw new AppError('Hanya pemilik pengajuan yang dapat submit', 403);
    }
    if (travel.status !== TravelRequestStatus.DRAFT) {
      throw new AppError('Hanya pengajuan berstatus DRAFT yang dapat disubmit', 400);
    }

    const approvals: { level: number; approverId: number }[] = [];
    for (const { level, role } of APPROVAL_LEVEL_ROLES) {
      const preferred = await prisma.user.findFirst({
        where: { role, isActive: true, id: { not: userId } },
        select: { id: true },
      });
      const candidate = preferred ??
        (await prisma.user.findFirst({
          where: { role, isActive: true },
          select: { id: true },
        }));
      if (!candidate) continue;
      approvals.push({ level, approverId: candidate.id });
    }

    const updated = await travelRepository.submitWithApprovals(id, approvals);

    for (const approval of approvals) {
      await notificationService.notify(
        approval.approverId,
        'Pengajuan travel baru',
        'Ada pengajuan travel yang menunggu persetujuan Anda',
        NotificationType.APPROVAL_REQUIRED
      );
    }

    return updated;
  },

  async cancel(userId: number, id: number) {
    const travel = await travelRepository.findById(id);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId) {
      throw new AppError('Hanya pemilik pengajuan yang dapat membatalkan', 403);
    }
    if (FINAL_TRAVEL_STATUSES.includes(travel.status)) {
      throw new AppError('Pengajuan dengan status ini tidak dapat dibatalkan', 400);
    }
    return travelRepository.updateStatus(id, TravelRequestStatus.CANCELLED);
  },

  async uploadDocument(
    userId: number,
    travelId: number,
    file: { originalname: string; filename: string; mimetype: string } | undefined
  ) {
    if (!file) throw new AppError('File wajib diunggah', 400);
    const travel = await travelRepository.findById(travelId);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId) {
      throw new AppError('Hanya pemilik pengajuan yang dapat mengunggah dokumen', 403);
    }
    return travelRepository.createDocument(travelId, {
      fileName: file.originalname,
      filePath: file.filename,
      fileType: file.mimetype,
    });
  },

  async listDocuments(userId: number, role: string, travelId: number) {
    const travel = await travelRepository.findById(travelId);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId && !(await canAccess(userId, role, travelId))) {
      throw new AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }
    return travelRepository.listDocuments(travelId);
  },

  async deleteDocument(userId: number, docId: number) {
    const doc = await travelRepository.findDocument(docId);
    if (!doc) throw new AppError('Dokumen tidak ditemukan', 404);
    if (doc.travel.userId !== userId) {
      throw new AppError('Hanya pemilik pengajuan yang dapat menghapus dokumen', 403);
    }
    const filePath = path.join(uploadDir, doc.filePath);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => undefined);
    }
    await travelRepository.deleteDocument(docId);
  },
};