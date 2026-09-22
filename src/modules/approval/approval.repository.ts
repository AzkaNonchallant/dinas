import { Prisma, ApprovalStatus, TravelRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import type { CreateDelegationInput } from './approval.schema';

const pendingInclude = {
  travel: {
    select: { destination: true, purpose: true, startDate: true, endDate: true },
  },
  approver: {
    select: { id: true, name: true },
  },
} as const;

const delegationInclude = {
  delegate: { select: { id: true, name: true } },
  delegator: { select: { id: true, name: true } },
} as const;

export const approvalRepository = {
  async findPendingForApprover(approverId: number, page: number, limit: number) {
    const today = new Date();

    const where: Prisma.ApprovalWhereInput = {
      status: 'PENDING',
      travel: { status: { in: ['SUBMITTED', 'IN_REVIEW'] } },
      OR: [
        { approverId },
        {
          approver: {
            delegationsGiven: {
              some: {
                delegateId: approverId,
                startDate: { lte: today },
                endDate: { gte: today },
              },
            },
          },
        },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        include: pendingInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.approval.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  findTimelineByTravelId(travelId: number) {
    return prisma.approval.findMany({
      where: { travelId },
      include: { approver: { select: { id: true, name: true } } },
      orderBy: { level: 'asc' },
    });
  },

  findByIdWithTravel(id: number) {
    return prisma.approval.findUnique({
      where: { id },
      include: { travel: true },
    });
  },

  findTravelOwner(travelId: number) {
    return prisma.travelRequest.findUnique({
      where: { id: travelId },
      select: { userId: true },
    });
  },

  hasApprovalForTravel(travelId: number, approverId: number) {
    return prisma.approval.findFirst({
      where: { travelId, approverId },
      select: { id: true },
    });
  },

  findActiveDelegation(delegatorId: number, delegateId: number) {
    const today = new Date();
    return prisma.approvalDelegation.findFirst({
      where: {
        delegatorId,
        delegateId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });
  },

  countPending(travelId: number) {
    return prisma.approval.count({ where: { travelId, status: 'PENDING' } });
  },

  findLowestPendingApprover(travelId: number) {
    return prisma.approval.findFirst({
      where: { travelId, status: 'PENDING' },
      orderBy: { level: 'asc' },
      select: { approverId: true },
    });
  },

  updateDecision(
    id: number,
    data: { status: ApprovalStatus; note?: string; approvedAt?: Date }
  ) {
    const updates: Prisma.ApprovalUncheckedUpdateInput = { status: data.status };
    if (data.note !== undefined) updates.note = data.note;
    if (data.approvedAt !== undefined) updates.approvedAt = data.approvedAt;
    return prisma.approval.update({ where: { id }, data: updates });
  },

  updateTravelStatus(id: number, status: TravelRequestStatus) {
    return prisma.travelRequest.update({ where: { id }, data: { status } });
  },

  findOverlappingDelegation(delegatorId: number, startDate: Date, endDate: Date) {
    return prisma.approvalDelegation.findFirst({
      where: {
        delegatorId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  },

  createDelegation(delegatorId: number, input: CreateDelegationInput) {
    const data: Prisma.ApprovalDelegationUncheckedCreateInput = {
      delegatorId,
      delegateId: input.delegateId,
      startDate: input.startDate,
      endDate: input.endDate,
    };
    if (input.reason !== undefined) data.reason = input.reason;
    return prisma.approvalDelegation.create({
      data,
      include: delegationInclude,
    });
  },

  findDelegationById(id: number) {
    return prisma.approvalDelegation.findUnique({ where: { id } });
  },

  listDelegations(userId: number) {
    return prisma.approvalDelegation.findMany({
      where: { OR: [{ delegatorId: userId }, { delegateId: userId }] },
      include: delegationInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  deleteDelegation(id: number) {
    return prisma.approvalDelegation.delete({ where: { id } });
  },

  findUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
  },
};