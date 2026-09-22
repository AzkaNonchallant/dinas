import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import {
  createTravelSchema,
  docIdParamSchema,
  idParamSchema,
  listTravelQuerySchema,
  updateTravelSchema,
} from './travel.schema';
import { travelService } from './travel.service';

export const travelController = {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listTravelQuerySchema.parse(req.query);
      const data = await travelService.list(req.user!.id, req.user!.role, query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await travelService.getById(req.user!.id, req.user!.role, id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTravelSchema.parse(req.body);
      const data = await travelService.create(req.user!.id, input);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updateTravelSchema.parse(req.body);
      const data = await travelService.update(req.user!.id, id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await travelService.remove(req.user!.id, id);
      return sendSuccess(res, null, 200);
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await travelService.submit(req.user!.id, id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await travelService.cancel(req.user!.id, id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await travelService.uploadDocument(req.user!.id, id, req.file);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await travelService.listDocuments(req.user!.id, req.user!.role, id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { docId } = docIdParamSchema.parse(req.params);
      await travelService.deleteDocument(req.user!.id, docId);
      return sendSuccess(res, null, 200);
    } catch (err) {
      next(err);
    }
  },
};