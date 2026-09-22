import { z } from 'zod';

export const decideSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(1000).optional(),
});

export const createDelegationSchema = z
  .strictObject({
    delegateId: z.number().int().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'endDate harus >= startDate',
    path: ['endDate'],
  });

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const travelIdParamSchema = z.object({
  travelId: z.coerce.number().int().positive(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type DecideApprovalInput = z.infer<typeof decideSchema>;
export type CreateDelegationInput = z.infer<typeof createDelegationSchema>;
export type ListApprovalsQuery = z.infer<typeof listQuerySchema>;