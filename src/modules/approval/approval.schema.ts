import { z } from 'zod';

export const decideApprovalSchema = z.object({
    status: z.enum(['APPOVED', 'REJECTED']),
    note: z.string().max(1000).optional(),
});

export const createDelegationSchema = z.strictObject({
    delegateId: z.number().int().postitive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().max(500).optional(),
})
.refine((data) => data.endDate >= data.startDate, {
    message: 'endDate harus >= startDate',
    path: ['endDate'],
});

export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;
export type CreateDelegationInput = z.infer<typeof createDelegationSchema>;