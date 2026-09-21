import { Request, Response, NextFunction} from 'express';
import  { bookingService } from './booking.service';
import { createBookingSchema, updateBookingStatusSchema } from
'./booking.schema';

export const bookingController = {
    async listByTravel(req: Request, res: Response, next: NextFunction){
        try {
            const travelId = Number(req.params.travelId);
        }
    }