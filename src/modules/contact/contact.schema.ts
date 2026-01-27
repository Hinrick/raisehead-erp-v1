import { z } from 'zod';

export const createContactSchema = z.object({
  type: z.enum(['PERSON', 'COMPANY']),
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  taxId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().uuid().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactIdSchema = z.object({
  id: z.string().uuid('Invalid contact ID'),
});

export const contactTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1, 'At least one tag ID is required'),
});

export const tagIdParamSchema = z.object({
  id: z.string().uuid('Invalid contact ID'),
  tagId: z.string().uuid('Invalid tag ID'),
});

export const contactSearchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(['PERSON', 'COMPANY']).optional(),
  tagId: z.string().uuid().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
