import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { notificationService } from './notification.service';
import { listNotificationsQuerySchema } from './notification.schema';
import { z } from 'zod';

const idSchema = z.coerce.number().int().positive();

export const notificationController = {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const data = await notificationService.list(req.user!.id, query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = idSchema.parse(req.params.id);
      const data = await notificationService.markRead(req.user!.id, id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationService.markAllRead(req.user!.id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationService.unreadCount(req.user!.id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
};