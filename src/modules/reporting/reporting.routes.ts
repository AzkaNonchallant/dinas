import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { reportingController } from './reporting.controller';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', requireRole(['ADMIN', 'SUPER_ADMIN']), reportingController.dashboard);
router.get(
  '/expense-by-department',
  requireRole(['FINANCE', 'ADMIN']),
  reportingController.expenseByDepartment
);
router.get(
  '/expense-by-employee',
  requireRole(['FINANCE', 'ADMIN']),
  reportingController.expenseByEmployee
);
router.get(
  '/expense-by-project',
  requireRole(['FINANCE', 'ADMIN']),
  reportingController.expenseByProject
);
router.get('/export', requireRole(['FINANCE', 'ADMIN']), reportingController.export);

export default router;