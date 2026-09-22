import { Router } from 'express';
import { approvalController } from './approval.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation,middleware';
import { decideApprovalSchema, cretaeDelegationSchema } from './approval.schema';

const router = Router();

router.use(authMiddleware);

router.get('/pending', approvalController.listPending);
router.get('/travel/:travelId/timeline', approvalController.listPending);
router.patch('/:id/decision', validate(decideApprovalSchema), approvalController.decide);

router.post('/delegations', validate(createDelegationScema), approvalController.createDelegation);
router.get('/delegations', approvalController.listDelegations);

export default router;