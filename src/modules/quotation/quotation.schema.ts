import { z } from 'zod';

const quotationItemSchema = z.object({
  itemNumber: z.number().int().positive(),
  description: z.string().min(1, 'Description is required'),
  details: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
});

export const createQuotationSchema = z.object({
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  projectName: z.string().min(1, 'Project name is required'),
  quotationDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  clientId: z.string().uuid('Invalid client ID'),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
  originalTotal: z.number().min(0),
  discountedTotal: z.number().min(0),
  taxIncluded: z.boolean().default(true),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const updateQuotationSchema = createQuotationSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
});

export const quotationIdSchema = z.object({
  id: z.string().uuid('Invalid quotation ID'),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
