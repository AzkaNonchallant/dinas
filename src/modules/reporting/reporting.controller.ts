import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { reportingService } from './reporting.service';
import { exportReportQuerySchema, reportRangeQuerySchema } from './reporting.schema';

export const reportingController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportingService.getDashboard();
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async expenseByDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const query = reportRangeQuerySchema.parse(req.query);
      const data = await reportingService.expenseByDepartment(query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async expenseByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const query = reportRangeQuerySchema.parse(req.query);
      const data = await reportingService.expenseByEmployee(query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async expenseByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const query = reportRangeQuerySchema.parse(req.query);
      const data = await reportingService.expenseByProject(query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  },

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const query = exportReportQuerySchema.parse(req.query);
      const csv = await reportingService.export(query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  },
};