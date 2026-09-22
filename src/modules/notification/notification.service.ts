import { NotificationType } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { notificationRepository } from './notification.repository';
import type { ListNotificationsQuery } from './notification.schema';
import { prisma } from '../../config/database';

export const notificationService = {
  async notify(userId: number, title: string, message: string, type: NotificationType) {
    return prisma.notification.create({
      data: { userId, title, message, type },
    });
  },

  async list(userId: number, query: ListNotificationsQuery) {
    const { items, total, page, limit } = await notificationRepository.findAll(userId, query);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async markRead(userId: number, id: number) {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw new AppError('Notifikasi tidak ditemukan', 404);
    if (notification.userId !== userId) throw new AppError('Forbidden', 403);
    return notificationRepository.markRead(id);
  },

  async markAllRead(userId: number) {
    const count = await notificationRepository.markAllRead(userId);
    return { count };
  },

  async unreadCount(userId: number) {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  },
};