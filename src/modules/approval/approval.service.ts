import { NotificationType } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { notificationService } from '../notification/notification.service';
import { approvalRepository } from './approval.repository';
import type { CreateDelegationInput, DecideApprovalInput, ListApprovalsQuery } from './approval.schema';
import type { JwtPayload } from '../../utils/jwt';

const APPROVAL_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRAVEL_ADMIN'];
const FINAL_TRAVEL_STATUSES = ['APPROVED', 'REJECTED', 'CANCELLED'];

export const approvalService = {
  async listPendingForApprover(userId: number, query: ListApprovalsQuery) {
    const { items, total, page, limit } = await approvalRepository.findPendingForApprover(
      userId,
      query.page,
      query.limit
    );
    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getApprovalTimeline(travelId: number, user: JwtPayload) {
    const travel = await approvalRepository.findTravelOwner(travelId);
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);

    const isAdmin = APPROVAL_ADMIN_ROLES.includes(user.role);
    const isOwner = travel.userId === user.id;
    if (!isAdmin && !isOwner) {
      const approval = await approvalRepository.hasApprovalForTravel(travelId, user.id);
      if (!approval) throw new AppError('Anda tidak memiliki akses ke pengajuan ini', 403);
    }

    return approvalRepository.findTimelineByTravelId(travelId);
  },

  async decide(approvalId: number, userId: number, input: DecideApprovalInput) {
    const approval = await approvalRepository.findByIdWithTravel(approvalId);
    if (!approval) throw new AppError('Approval tidak ditemukan', 404);

    if (FINAL_TRAVEL_STATUSES.includes(approval.travel.status)) {
      throw new AppError('Pengajuan sudah diputuskan', 400);
    }

    if (approval.status !== 'PENDING') {
      throw new AppError('Approval ini sudah diputuskan', 400);
    }

    const isApprover = approval.approverId === userId;
    if (!isApprover) {
      const delegation = await approvalRepository.findActiveDelegation(approval.approverId, userId);
      if (!delegation) throw new AppError('Anda tidak berhak memutuskan approval ini', 403);
    }

    if (input.status === 'REJECTED') {
      const updates: { status: 'REJECTED'; note?: string } = { status: 'REJECTED' };
      if (input.note !== undefined) updates.note = input.note;
      await approvalRepository.updateDecision(approvalId, updates);
      await approvalRepository.updateTravelStatus(approval.travelId, 'REJECTED');
      await notificationService.notify(
        approval.travel.userId,
        'Pengajuan ditolak',
        `Pengajuan travel ditolak: ${approval.travel.destination}`,
        NotificationType.TRAVEL_REJECTED
      );
      return approvalRepository.findByIdWithTravel(approvalId);
    }

    const updates: { status: 'APPROVED'; note?: string; approvedAt: Date } = {
      status: 'APPROVED',
      approvedAt: new Date(),
    };
    if (input.note !== undefined) updates.note = input.note;
    await approvalRepository.updateDecision(approvalId, updates);

    const pendingCount = await approvalRepository.countPending(approval.travelId);

    if (pendingCount === 0) {
      await approvalRepository.updateTravelStatus(approval.travelId, 'APPROVED');
      await notificationService.notify(
        approval.travel.userId,
        'Pengajuan disetujui',
        `Pengajuan travel disetujui: ${approval.travel.destination}`,
        NotificationType.TRAVEL_APPROVED
      );
    } else {
      await approvalRepository.updateTravelStatus(approval.travelId, 'IN_REVIEW');
      const next = await approvalRepository.findLowestPendingApprover(approval.travelId);
      if (next) {
        await notificationService.notify(
          next.approverId,
          'Persetujuan diperlukan',
          `Pengajuan travel menunggu persetujuan: ${approval.travel.destination}`,
          NotificationType.APPROVAL_REQUIRED
        );
      }
    }

    return approvalRepository.findByIdWithTravel(approvalId);
  },

  async createDelegation(delegatorId: number, input: CreateDelegationInput) {
    const delegate = await approvalRepository.findUserById(input.delegateId);
    if (!delegate) throw new AppError('User tidak ditemukan', 400);
    if (!delegate.isActive) throw new AppError('User tidak aktif', 400);
    if (delegate.id === delegatorId) throw new AppError('Tidak dapat mendelegasikan ke diri sendiri', 400);

    const overlapping = await approvalRepository.findOverlappingDelegation(
      delegatorId,
      input.startDate,
      input.endDate
    );
    if (overlapping) {
      throw new AppError('Sudah ada delegasi aktif pada rentang tanggal tersebut', 400);
    }

    return approvalRepository.createDelegation(delegatorId, input);
  },

  async listDelegations(userId: number) {
    return approvalRepository.listDelegations(userId);
  },

  async deleteDelegation(delegationId: number, userId: number) {
    const delegation = await approvalRepository.findDelegationById(delegationId);
    if (!delegation) throw new AppError('Delegasi tidak ditemukan', 404);
    if (delegation.delegatorId !== userId) {
      throw new AppError('Anda tidak berhak membatalkan delegasi ini', 403);
    }

    const today = new Date();
    if (delegation.startDate <= today) {
      throw new AppError('Delegasi sudah aktif, tidak dapat dibatalkan', 400);
    }

    return approvalRepository.deleteDelegation(delegationId);
  },
};