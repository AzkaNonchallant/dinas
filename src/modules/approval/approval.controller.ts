import { Request, Response, NextFunction } from 'express';
import { approvalService } from './approval.service';
import { decideApprovelSchema, createDelegationSchema } from './approval.schema';

export const approvalController = {
    async listPending(req: Request, res: Response, next: NextFunction) {
        try {
            const approvedId = req.user!.id; 
            
            const data = await approvalService.listPendingForApprover(approverId);
            res.status(200).json({ success:true, data});
        } catch (err) {
            next(err);
        }
    },

    async getTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const travelId = Number(req.params.travelId);
            const data = await approvalService.getApprovalTimeline(travelId);
            res.status(200).json({ success: true, data});
        } catch (err) {
            next(err);
        }
    },
    async decide(req: Request, res: Response, next: NextFunction) {
        try {
            const approvalId = Number(req.params.id);
            const approverId = req.user!.id;
            const input = decideApprovalSchema.parse(req.body);
            const data = await approvalService.decide(approvalId, approverId, input);
            res.status(200).json({ succes: true, data});
        } catch (err) {
            next(err);
        }
    },

    async createDelegation(req: Request, res: Response, next: NextFunction) {
        try {
            const delegatorId = req.user!.id
            const input = createDelegationSchema.parse(req.body);
            const data = await approvalService.createDelegation(delegatorId, input);
            res.status(201).json([ success: true, data]);
        } catch (err) {
            next(err);
        }
    },

    async listDelegations(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const data = await approvalService.listDelegations(userId);
            res.status(200).json({ success: true, data});
        } catch (err) {
            next(err);
        }
    },
};