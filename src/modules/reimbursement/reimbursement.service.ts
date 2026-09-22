import { AppError } from '../../middleware/error.middleware';
import { prisma } from '../../config/database';
import { reimbursementRepository } from './reimbursement.repository';
import type {
  CreateReimbursementInput,
  CreateItemInput,
  ListReimbursementsQuery,
  VerifyReimbursementInput,
  PayReimbursementInput,
} from './reimbursement.schema';

export const reimbursementService = {
  async create(userId: number, input: CreateReimbursementInput) {
    const travel = await prisma.travelRequest.findUnique({ where: { id: input.travelId } });

    if (!travel) throw new AppError('Travel request tidak ditemukan', 404);
    if (travel.userId !== userId) throw new AppError('Anda tidak berhak membuat reimbursement untuk travel ini', 403);
    if (travel.status !== 'COMPLETED') {
      throw new AppError('Reimbursement hanya bisa dibuat setelah perjalanan berstatus COMPLETED', 400);
    }

    const existing = await reimbursementRepository.findByTravelId(input.travelId);
    if (existing) throw new AppError('Reimbursement untuk travel ini sudah pernah dibuat', 409);

    return reimbursementRepository.create(input.travelId, input);
  },

  async list(query: ListReimbursementsQuery, userId?: number) {
    return reimbursementRepository.list(query, userId);
  },

  async getById(id: number, requesterId: number, requesterRole: string) {
    const reimbursement = await reimbursementRepository.findById(id);
    if (!reimbursement) throw new AppError('Reimbursement tidak ditemukan', 404);

    const isOwner = reimbursement.travel.userId === requesterId;
    const isFinance = requesterRole === 'FINANCE' || requesterRole === 'SUPER_ADMIN';
    if (!isOwner && !isFinance) throw new AppError('Anda tidak berhak melihat reimbursement ini', 403);

    return reimbursement;
  },

  async addItem(reimbursementId: number, userId: number, input: CreateItemInput) {
    const reimbursement = await this.assertOwnedAndEditable(reimbursementId, userId);

    await reimbursementRepository.createItem(reimbursementId, input);
    return reimbursementRepository.recalculateTotal(reimbursementId);
  },

  async deleteItem(itemId: number, userId: number) {
    const item = await reimbursementRepository.findItemById(itemId);
    if (!item) throw new AppError('Item tidak ditemukan', 404);

    await this.assertOwnedAndEditable(item.reimbursementId, userId);

    await reimbursementRepository.deleteItem(itemId);
    return reimbursementRepository.recalculateTotal(item.reimbursementId);
  },

  async submit(reimbursementId: number, userId: number) {
    const reimbursement = await this.assertOwnedAndEditable(reimbursementId, userId);

    if (reimbursement.totalAmount.toNumber() <= 0) {
      throw new AppError('Tidak bisa submit reimbursement tanpa item pengeluaran', 400);
    }

    return reimbursementRepository.setSubmitted(reimbursementId);
    // TODO: trigger notification "REIMBURSEMENT_SUBMITTED" ke Finance
  },

  async verify(reimbursementId: number, input: VerifyReimbursementInput) {
    const reimbursement = await reimbursementRepository.findById(reimbursementId);
    if (!reimbursement) throw new AppError('Reimbursement tidak ditemukan', 404);

    if (reimbursement.status !== 'SUBMITTED' && reimbursement.status !== 'IN_REVIEW') {
      throw new AppError('Reimbursement ini tidak dalam status yang bisa diverifikasi', 400);
    }

    const advanceAmount = reimbursement.advanceAmount.toNumber();
    const differenceAmount = input.approvedAmount - advanceAmount;

    const updated = await reimbursementRepository.setVerified(
      reimbursementId,
      input.approvedAmount,
      differenceAmount,
      input.status
    );

    return updated;
  },

  async pay(reimbursementId: number, input: PayReimbursementInput) {
    const reimbursement = await reimbursementRepository.findById(reimbursementId);
    if (!reimbursement) throw new AppError('Reimbursement tidak ditemukan', 404);

    if (reimbursement.status !== 'APPROVED') {
      throw new AppError('Hanya reimbursement APPROVED yang bisa ditandai dibayar', 400);
    }

    return reimbursementRepository.setPaid(reimbursementId, input.externalJournalRef);
  },

  async assertOwnedAndEditable(reimbursementId: number, userId: number) {
    const reimbursement = await reimbursementRepository.findById(reimbursementId);
    if (!reimbursement) throw new AppError('Reimbursement tidak ditemukan', 404);
    if (reimbursement.travel.userId !== userId) {
      throw new AppError('Anda tidak berhak mengubah reimbursement ini', 403);
    }
    if (reimbursement.status !== 'DRAFT') {
      throw new AppError('Reimbursement hanya bisa diubah selagi masih status DRAFT', 400);
    }
    return reimbursement;
  },
};