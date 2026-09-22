import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { approvalController } from './approval.controller';
import { createDelegationSchema, decideSchema } from './approval.schema';

const router = Router();

router.use(authMiddleware);

router.get('/pending', requireRole(['MANAGER', 'DEPARTMENT_HEAD', 'HRD']), approvalController.listPending);

router.get('/travel/:travelId', approvalController.getTimeline);

router.post('/delegations', requireRole(['MANAGER', 'DEPARTMENT_HEAD', 'HRD']), validate(createDelegationSchema), approvalController.createDelegation);
router.get('/delegations', requireRole(['MANAGER', 'DEPARTMENT_HEAD', 'HRD']), approvalController.listDelegations);
router.delete('/delegations/:id', requireRole(['MANAGER', 'DEPARTMENT_HEAD', 'HRD']), approvalController.deleteDelegation);

router.patch('/:id/decision', validate(decideSchema), approvalController.decide);

export default router;