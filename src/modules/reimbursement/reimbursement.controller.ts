import { Request, Response, NextFunction } from 'express';
import { reimbursementService } from './reimbursement.service';
import { sendSuccess } from '../../utils/response';
import {
  createReimbursementSchema,
  listReimbursementsQuerySchema,
  createItemSchema,
  verifyReimbursementSchema,
  payReimbursementSchema,
} from './reimbursement.schema';

const FINANCE_ROLES = ['FINANCE', 'SUPER_ADMIN'];

export const reimbursementController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const input = createReimbursementSchema.parse(req.body);
      const data = await reimbursementService.create(userId, input);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listReimbursementsQuerySchema.parse(req.query);
      const isFinance = FINANCE_ROLES.includes(req.user!.role);

      const data = await reimbursementService.list(query, isFinance ? undefined : req.user!.id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await reimbursementService.getById(id, req.user!.id, req.user!.role);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const reimbursementId = Number(req.params.id);
      const userId = req.user!.id;
      const input = createItemSchema.parse(req.body);
      const data = await reimbursementService.addItem(reimbursementId, userId, input);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = Number(req.params.itemId);
      const userId = req.user!.id;
      const data = await reimbursementService.deleteItem(itemId, userId);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.id;
      const data = await reimbursementService.submit(id, userId);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const input = verifyReimbursementSchema.parse(req.body);
      const data = await reimbursementService.verify(id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async pay(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const input = payReimbursementSchema.parse(req.body);
      const data = await reimbursementService.pay(id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },
};