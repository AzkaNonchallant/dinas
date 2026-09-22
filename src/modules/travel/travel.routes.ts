import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { upload } from '../../utils/upload';
import { travelBookingController } from './travel.booking.controller';
import { travelController } from './travel.controller';
import { travelPolicyController } from './travel.policy.controller';
import {
  bookingSchema,
  bookingStatusSchema,
  createTravelSchema,
  policySchema,
  updatePolicySchema,
  updateTravelSchema,
} from './travel.schema';

const router = Router();

router.use(authMiddleware);

router.get('/bookings/pending', requireRole(['TRAVEL_ADMIN', 'ADMIN']), travelBookingController.listPending);
router.post('/:travelId/bookings', requireRole(['TRAVEL_ADMIN', 'ADMIN']), validate(bookingSchema), travelBookingController.create);
router.get('/:travelId/bookings', travelBookingController.list);
router.patch('/bookings/:id/status', requireRole(['TRAVEL_ADMIN', 'ADMIN']), validate(bookingStatusSchema), travelBookingController.updateStatus);

router.get('/policies/applicable', travelPolicyController.listApplicable);
router.get('/policies', travelPolicyController.index);
router.post('/policies', requireRole(['SUPER_ADMIN']), validate(policySchema), travelPolicyController.create);
router.put('/policies/:id', requireRole(['SUPER_ADMIN']), validate(updatePolicySchema), travelPolicyController.update);
router.delete('/policies/:id', requireRole(['SUPER_ADMIN']), travelPolicyController.remove);

router.post('/:id/documents', upload.single('file'), travelController.uploadDocument);
router.get('/:id/documents', travelController.listDocuments);
router.delete('/documents/:docId', travelController.deleteDocument);

router.post('/', requireRole(['EMPLOYEE']), validate(createTravelSchema), travelController.create);
router.get('/', travelController.index);
router.get('/:id', travelController.show);
router.patch('/:id', validate(updateTravelSchema), travelController.update);
router.delete('/:id', travelController.remove);
router.post('/:id/submit', travelController.submit);
router.post('/:id/cancel', travelController.cancel);

export default router;