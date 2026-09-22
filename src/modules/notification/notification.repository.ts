import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import type { ListNotificationsQuery } from './notification.schema';

export const notificationRepository = {
  async findAll(userId: number, query: ListNotificationsQuery) {
    const { page, limit, isRead } = query;

    const where = {
      userId,
      ...(isRead !== undefined ? { isRead: isRead === 'true' } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  findById(id: number) {
    return prisma.notification.findUnique({ where: { id } });
  },

  markRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: number) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  },

  countUnread(userId: number) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },
};