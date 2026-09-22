import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { departmentService, positionService, userService } from './user.service';
import {
  assignRoleSchema,
  createDepartmentSchema,
  createPositionSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateDepartmentSchema,
  updatePositionSchema,
  updateUserSchema,
} from './user.schema';

export const userController = {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listUsersQuerySchema.parse(req.query);
      const data = await userService.list(query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await userService.getById(id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updateUserSchema.parse(req.body);
      const data = await userService.update(id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = assignRoleSchema.parse(req.body);
      const data = await userService.assignRole(id, input);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await userService.deactivate(id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async listDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await departmentService.list();
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createDepartmentSchema.parse(req.body);
      const data = await departmentService.create(input.name);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updateDepartmentSchema.parse(req.body);
      const data = await departmentService.update(id, input.name);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await departmentService.remove(id);
      return sendSuccess(res, null, 200);
    } catch (err) {
      next(err);
    }
  },

  async listPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await positionService.list();
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPositionSchema.parse(req.body);
      const data = await positionService.create(input.name);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const input = updatePositionSchema.parse(req.body);
      const data = await positionService.update(id, input.name);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await positionService.remove(id);
      return sendSuccess(res, null, 200);
    } catch (err) {
      next(err);
    }
  },
};