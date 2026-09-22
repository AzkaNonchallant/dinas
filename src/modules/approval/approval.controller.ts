import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { approvalService } from './approval.service';
import {
  createDelegationSchema,
  decideSchema,
  idParamSchema,
  listQuerySchema,
  travelIdParamSchema,
} from './approval.schema';

export const approvalController = {
  async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query);
      const data = await approvalService.listPendingForApprover(req.user!.id, query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { travelId } = travelIdParamSchema.parse(req.params);
      const data = await approvalService.getApprovalTimeline(travelId, req.user!);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async decide(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = decideSchema.parse(req.body);
      const data = await approvalService.decide(id, req.user!.id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async createDelegation(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createDelegationSchema.parse(req.body);
      const data = await approvalService.createDelegation(req.user!.id, input);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async listDelegations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await approvalService.listDelegations(req.user!.id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async deleteDelegation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await approvalService.deleteDelegation(id, req.user!.id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
};