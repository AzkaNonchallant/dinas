import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { travelBookingService } from './travel.booking.service';
import { bookingSchema, bookingStatusSchema, idParamSchema, travelIdParamSchema } from './travel.schema';

export const travelBookingController = {
  async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await travelBookingService.listPending();
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { travelId } = travelIdParamSchema.parse(req.params);
      const input = bookingSchema.parse(req.body);
      const data = await travelBookingService.create(travelId, input);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { travelId } = travelIdParamSchema.parse(req.params);
      const data = await travelBookingService.list(req.user!.id, req.user!.role, travelId);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = bookingStatusSchema.parse(req.body);
      const data = await travelBookingService.updateStatus(id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
};