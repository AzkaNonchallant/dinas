import { z } from 'zod';

export const reportRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const exportReportQuerySchema = z.object({
  format: z.enum(['pdf', 'excel']).optional().default('excel'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ReportRangeQuery = z.infer<typeof reportRangeQuerySchema>;
export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>;