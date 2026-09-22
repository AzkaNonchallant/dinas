import { TravelRequestStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

const expenseStatuses = [TravelRequestStatus.APPROVED, TravelRequestStatus.COMPLETED] as const;

function expenseWhere(from?: Date, to?: Date): Prisma.TravelRequestWhereInput {
  const endDateFilter: Prisma.DateTimeFilter = {};
  if (from) endDateFilter.gte = from;
  if (to) endDateFilter.lte = to;

  return {
    status: { in: [...expenseStatuses] },
    ...(from || to ? { endDate: endDateFilter } : {}),
  };
}

export const reportingRepository = {
  async dashboard() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const statuses = [
      TravelRequestStatus.DRAFT,
      TravelRequestStatus.SUBMITTED,
      TravelRequestStatus.IN_REVIEW,
      TravelRequestStatus.APPROVED,
      TravelRequestStatus.REJECTED,
      TravelRequestStatus.CANCELLED,
      TravelRequestStatus.COMPLETED,
    ] as const;

    const [total, statusCounts, upcoming, ongoing, completed, costAgg] = await Promise.all([
      prisma.travelRequest.count(),
      Promise.all(statuses.map((status) => prisma.travelRequest.count({ where: { status } }))),
      prisma.travelRequest.count({
        where: { status: TravelRequestStatus.APPROVED, startDate: { gt: today } },
      }),
      prisma.travelRequest.count({
        where: {
          status: TravelRequestStatus.APPROVED,
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      prisma.travelRequest.count({
        where: {
          OR: [
            { status: TravelRequestStatus.COMPLETED },
            { status: TravelRequestStatus.APPROVED, endDate: { lt: today } },
          ],
        },
      }),
      prisma.travelRequest.aggregate({
        where: expenseWhere(undefined, undefined),
        _sum: { estimatedCost: true },
      }),
    ]);

    const byStatus = Object.fromEntries(
      statuses.map((status, index) => [status, statusCounts[index] ?? 0])
    ) as Record<TravelRequestStatus, number>;

    return {
      total,
      byStatus,
      upcoming,
      ongoing,
      completed,
      totalEstimatedCost: Number(costAgg._sum.estimatedCost ?? 0),
    };
  },

  async expenseByDepartment(from?: Date, to?: Date) {
    const where = expenseWhere(from, to);
    const grouped = await prisma.travelRequest.groupBy({
      by: ['userId'],
      where,
      _sum: { estimatedCost: true },
    });

    const userIds = grouped.map((group) => group.userId);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, departmentId: true },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));

    const departmentIds = Array.from(
      new Set(users.map((user) => user.departmentId).filter((id): id is number => id !== null))
    );
    const departments = departmentIds.length
      ? await prisma.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, name: true },
        })
      : [];

    const departmentMap = new Map(departments.map((department) => [department.id, department.name]));

    return grouped.map((group) => {
      const user = userMap.get(group.userId);
      const departmentId = user?.departmentId ?? null;
      const department =
        departmentId === null ? 'Tanpa departemen' : (departmentMap.get(departmentId) ?? null);

      return {
        departmentId,
        department,
        total: Number(group._sum.estimatedCost ?? 0),
      };
    });
  },

  async expenseByEmployee(from?: Date, to?: Date) {
    const where = expenseWhere(from, to);
    const grouped = await prisma.travelRequest.groupBy({
      by: ['userId'],
      where,
      _sum: { estimatedCost: true },
    });

    const userIds = grouped.map((group) => group.userId);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));

    return grouped.map((group) => {
      const user = userMap.get(group.userId);
      return {
        userId: group.userId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        total: Number(group._sum.estimatedCost ?? 0),
      };
    });
  },

  async expenseByProject(from?: Date, to?: Date) {
    const where = expenseWhere(from, to);
    const grouped = await prisma.travelRequest.groupBy({
      by: ['purpose'],
      where,
      _sum: { estimatedCost: true },
    });

    return grouped.map((group) => ({
      purpose: group.purpose,
      total: Number(group._sum.estimatedCost ?? 0),
    }));
  },
};