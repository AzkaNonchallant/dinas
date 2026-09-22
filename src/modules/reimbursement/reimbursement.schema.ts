import { ReimbursementStatus } from '@prisma/client';
import { z } from 'zod';

export const createReimbursementSchema = z.object({
  travelId: z.number().int().positive(),
  advanceAmount: z.coerce.number().nonnegative().default(0),
});

export const listReimbursementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(ReimbursementStatus).optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const itemIdParamSchema = z.object({
  itemId: z.coerce.number().int().positive(),
});

export const createItemSchema = z.object({
  category: z.enum(['TRANSPORT', 'HOTEL', 'MEAL', 'ALLOWANCE', 'OTHER']),
  description: z.string().trim().min(2),
  amount: z.coerce.number().nonnegative(),
  transactionDate: z.coerce.date(),
  receiptPath: z.string().trim().max(500).nullish(),
});

export const verifyReimbursementSchema = z.object({
  approvedAmount: z.coerce.number().nonnegative(),
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const payReimbursementSchema = z.object({
  externalJournalRef: z.string().trim().min(1).max(200),
});

export type CreateReimbursementInput = z.infer<typeof createReimbursementSchema>;
export type ListReimbursementsQuery = z.infer<typeof listReimbursementsQuerySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type VerifyReimbursementInput = z.infer<typeof verifyReimbursementSchema>;
export type PayReimbursementInput = z.infer<typeof payReimbursementSchema>;