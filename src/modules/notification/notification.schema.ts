import { NotificationType } from '@prisma/client';
import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isRead: z.enum(['true', 'false']).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;