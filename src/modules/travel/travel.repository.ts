import { ApprovalStatus, Prisma, TravelRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import type { CreateTravelInput, ListTravelQuery, UpdateTravelInput } from './travel.schema';

const travelDetailInclude = {
  approvals: { orderBy: { level: 'asc' } },
  documents: true,
  bookings: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

const travelListInclude = {
  user: { select: { id: true, name: true, email: true } },
} as const;

export const travelRepository = {
  create(userId: number, data: CreateTravelInput) {
    return prisma.travelRequest.create({
      data: {
        userId,
        policyId: data.policyId,
        destination: data.destination,
        purpose: data.purpose,
        startDate: data.startDate,
        endDate: data.endDate,
        estimatedCost: data.estimatedCost,
      },
      include: travelDetailInclude,
    });
  },

  async findAll(where: Prisma.TravelRequestWhereInput, query: ListTravelQuery) {
    const { page, limit } = query;

    const [items, total] = await Promise.all([
      prisma.travelRequest.findMany({
        where,
        include: travelListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.travelRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  findById(id: number) {
    return prisma.travelRequest.findUnique({ where: { id }, include: travelDetailInclude });
  },

  update(id: number, data: UpdateTravelInput) {
    const updates: Prisma.TravelRequestUncheckedUpdateInput = {};
    if (data.destination !== undefined) updates.destination = data.destination;
    if (data.purpose !== undefined) updates.purpose = data.purpose;
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.estimatedCost !== undefined) updates.estimatedCost = data.estimatedCost;
    if (data.policyId !== undefined) updates.policyId = data.policyId;
    return prisma.travelRequest.update({
      where: { id },
      data: updates,
      include: travelDetailInclude,
    });
  },

  remove(id: number) {
    return prisma.travelRequest.delete({ where: { id } });
  },

  updateStatus(id: number, status: TravelRequestStatus) {
    return prisma.travelRequest.update({
      where: { id },
      data: { status },
      include: travelDetailInclude,
    });
  },

  submitWithApprovals(id: number, approvals: { level: number; approverId: number }[]) {
    return prisma.$transaction(async (tx) => {
      await tx.travelRequest.update({
        where: { id },
        data: { status: TravelRequestStatus.SUBMITTED },
      });
      for (const approval of approvals) {
        await tx.approval.create({
          data: {
            travelId: id,
            level: approval.level,
            approverId: approval.approverId,
            status: ApprovalStatus.PENDING,
          },
        });
      }
      return tx.travelRequest.findUnique({ where: { id }, include: travelDetailInclude });
    });
  },

  createDocument(travelId: number, data: { fileName: string; filePath: string; fileType: string }) {
    return prisma.travelDocument.create({ data: { travelId, ...data } });
  },

  listDocuments(travelId: number) {
    return prisma.travelDocument.findMany({
      where: { travelId },
      orderBy: { uploadedAt: 'desc' },
    });
  },

  findDocument(docId: number) {
    return prisma.travelDocument.findUnique({
      where: { id: docId },
      include: { travel: true },
    });
  },

  deleteDocument(docId: number) {
    return prisma.travelDocument.delete({ where: { id: docId } });
  },

  countApprovalsByApprover(travelId: number, approverId: number) {
    return prisma.approval.count({ where: { travelId, approverId } });
  },
};