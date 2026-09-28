import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { reimbursementController } from './reimbursement.controller';
import {
  createItemSchema,
  createReimbursementSchema,
  payReimbursementSchema,
  verifyReimbursementSchema,
} from './reimbursement.schema';

const FINANCE_ROLES = ['FINANCE', 'SUPER_ADMIN'];

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createReimbursementSchema), reimbursementController.create);
router.get('/', reimbursementController.list);
router.get('/:id', reimbursementController.getById);
router.post('/:id/items', validate(createItemSchema), reimbursementController.addItem);
router.delete('/items/:itemId', reimbursementController.deleteItem);
router.post('/:id/submit', reimbursementController.submit);
router.patch('/:id/verify', requireRole(FINANCE_ROLES), validate(verifyReimbursementSchema), reimbursementController.verify);
router.patch('/:id/pay', requireRole(FINANCE_ROLES), validate(payReimbursementSchema), reimbursementController.pay);

export default router;
