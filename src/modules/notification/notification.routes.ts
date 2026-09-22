import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { notificationController } from './notification.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationController.index);
router.patch('/read-all', notificationController.markAllRead);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/:id/read', notificationController.markRead);

export default router;