import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  fax: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyIdSchema = z.object({
  id: z.string().uuid('Invalid company ID'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
