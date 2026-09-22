import { prisma } from '../../config/database';
import type { CreateReimbursementInput, CreateItemInput, ListReimbursementsQuery } from './reimbursement.schema';

export const reimbursementRepository = {
  findByTravelId(travelId: number) {
    return prisma.reimbursement.findUnique({
      where: { travelId },
      include: { items: true },
    });
  },

  findById(id: number) {
    return prisma.reimbursement.findUnique({
      where: { id },
      include: {
        items: true,
        travel: { include: { user: true } },
      },
    });
  },

  create(travelId: number, data: CreateReimbursementInput) {
    return prisma.reimbursement.create({
      data: {
        travelId,
        advanceAmount: data.advanceAmount,
        totalAmount: 0, 
        status: 'DRAFT',
      },
    });
  },

  async list(query: ListReimbursementsQuery, userId?: number) {
    const where = {
      status: query.status,
      travel: userId ? { userId } : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        include: { travel: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.reimbursement.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  },

  updateStatus(id: number, status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID', extra: Record<string, unknown> = {}) {
    return prisma.reimbursement.update({
      where: { id },
      data: { status, ...extra },
    });
  },

  setSubmitted(id: number) {
    return prisma.reimbursement.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  },

  setVerified(id: number, approvedAmount: number, differenceAmount: number, status: 'APPROVED' | 'REJECTED') {
    return prisma.reimbursement.update({
      where: { id },
      data: { approvedAmount, differenceAmount, status, approvedAt: new Date() },
    });
  },

  setPaid(id: number, externalJournalRef: string) {
    return prisma.reimbursement.update({
      where: { id },
      data: { status: 'PAID', externalJournalRef },
    });
  },

  // Items
  findItemById(itemId: number) {
    return prisma.reimbursementItem.findUnique({ where: { id: itemId } });
  },

  createItem(reimbursementId: number, data: CreateItemInput) {
    return prisma.reimbursementItem.create({
      data: { reimbursementId, ...data },
    });
  },

  deleteItem(itemId: number) {
    return prisma.reimbursementItem.delete({ where: { id: itemId } });
  },

  // Hitung ulang totalAmount = SUM semua item, dipanggil setiap kali item ditambah/dihapus
  async recalculateTotal(reimbursementId: number) {
    const result = await prisma.reimbursementItem.aggregate({
      where: { reimbursementId },
      _sum: { amount: true },
    });

    const totalAmount = result._sum.amount ?? 0;

    return prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { totalAmount },
    });
  },
};