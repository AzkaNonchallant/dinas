import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { userController } from './user.controller';
import {
  assignRoleSchema,
  createDepartmentSchema,
  createPositionSchema,
  updateDepartmentSchema,
  updatePositionSchema,
  updateUserSchema,
} from './user.schema';

const router = Router();

router.use(authMiddleware);

router.get('/departments', userController.listDepartments);
router.post('/departments', requireRole(['SUPER_ADMIN']), validate(createDepartmentSchema), userController.createDepartment);
router.put('/departments/:id', requireRole(['SUPER_ADMIN']), validate(updateDepartmentSchema), userController.updateDepartment);
router.delete('/departments/:id', requireRole(['SUPER_ADMIN']), userController.deleteDepartment);

router.get('/positions', userController.listPositions);
router.post('/positions', requireRole(['SUPER_ADMIN']), validate(createPositionSchema), userController.createPosition);
router.put('/positions/:id', requireRole(['SUPER_ADMIN']), validate(updatePositionSchema), userController.updatePosition);
router.delete('/positions/:id', requireRole(['SUPER_ADMIN']), userController.deletePosition);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), userController.index);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), userController.show);
router.put('/:id', requireRole(['SUPER_ADMIN']), validate(updateUserSchema), userController.update);
router.patch('/:id/role', requireRole(['SUPER_ADMIN']), validate(assignRoleSchema), userController.assignRole);
router.delete('/:id', requireRole(['SUPER_ADMIN']), userController.deactivate);

export default router;