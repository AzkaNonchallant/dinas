import { z } from 'zod';

export const createTravelSchema = z
  .object({
    destination: z.string().trim().min(2, 'Destinasi minimal 2 karakter'),
    purpose: z.string().trim().min(3, 'Tujuan minimal 3 karakter'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    estimatedCost: z.coerce.number().positive(),
    policyId: z.number().int().positive(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'endDate harus >= startDate',
    path: ['endDate'],
  });

export const updateTravelSchema = z
  .object({
    destination: z.string().trim().min(2, 'Destinasi minimal 2 karakter').optional(),
    purpose: z.string().trim().min(3, 'Tujuan minimal 3 karakter').optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    estimatedCost: z.coerce.number().positive().optional(),
    policyId: z.number().int().positive().optional(),
  })
  .refine(
    (data) =>
      data.endDate === undefined ||
      data.startDate === undefined ||
      data.endDate >= data.startDate,
    {
      message: 'endDate harus >= startDate',
      path: ['endDate'],
    }
  );

export const listTravelQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'])
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const bookingSchema = z.object({
  type: z.enum(['TRANSPORT', 'HOTEL', 'OTHER']),
  provider: z.string().trim().optional(),
  bookingCode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  bookingDate: z.coerce.date().nullish(),
  amount: z.coerce.number().nonnegative(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
});

export const policySchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  positionId: z.number().int().positive().nullish(),
  destinationTier: z.enum(['DOMESTIC', 'INTERNATIONAL']).default('DOMESTIC'),
  hotelLimit: z.coerce.number().nonnegative(),
  transportLimit: z.coerce.number().nonnegative(),
  allowanceLimit: z.coerce.number().nonnegative(),
});

export const updatePolicySchema = policySchema.omit({}).partial();

export const applicablePolicyQuerySchema = z.object({
  positionId: z.coerce.number().int().positive(),
  destinationTier: z.enum(['DOMESTIC', 'INTERNATIONAL']),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const travelIdParamSchema = z.object({
  travelId: z.coerce.number().int().positive(),
});

export const docIdParamSchema = z.object({
  docId: z.coerce.number().int().positive(),
});

export type CreateTravelInput = z.infer<typeof createTravelSchema>;
export type UpdateTravelInput = z.infer<typeof updateTravelSchema>;
export type ListTravelQuery = z.infer<typeof listTravelQuerySchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingStatusInput = z.infer<typeof bookingStatusSchema>;
export type PolicyInput = z.infer<typeof policySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type ApplicablePolicyQuery = z.infer<typeof applicablePolicyQuerySchema>;