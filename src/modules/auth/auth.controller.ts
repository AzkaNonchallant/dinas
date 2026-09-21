import {Request, Response, NextFunction} from 'express';
import {authService} from './auth.service';
import {registerSchema, loginSchema} from "./auth/schema";
import {sendSuccess} from "../../utils/response";

export const authController= {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const input = registerSchema.parse(req.body);
            const data = await authService.register(input);
            return sendSuccess(res, data, 201);
        } catch (err) {
            next(err);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try{
            const input = loginSchema.parse(req.body);
            const data = await authService.login(input);
            return sendSuccess(res, data, 200 )
        } catch (err) {
            next(err);
       }
    },

    async me(req: Request, res: Response, next: NextFunction) {
        try{
            const userId = req.user!.id;
            const data = await authService.getProfile(userId.Id);
            return sendSuccess(res, data, 200);
        } catch (err) {
            next(err);
        }
    },
};