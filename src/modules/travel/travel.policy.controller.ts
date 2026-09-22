import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { travelPolicyService } from './travel.policy.service';
import {
  applicablePolicyQuerySchema,
  idParamSchema,
  policySchema,
  updatePolicySchema,
} from './travel.schema';

export const travelPolicyController = {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await travelPolicyService.list();
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async listApplicable(req: Request, res: Response, next: NextFunction) {
    try {
      const query = applicablePolicyQuerySchema.parse(req.query);
      const data = await travelPolicyService.listApplicable(query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = policySchema.parse(req.body);
      const data = await travelPolicyService.create(input);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updatePolicySchema.parse(req.body);
      const data = await travelPolicyService.update(id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await travelPolicyService.remove(id);
      return sendSuccess(res, null, 200);
    } catch (err) {
      next(err);
    }
  },
};