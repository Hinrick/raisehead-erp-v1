import { z } from 'zod';

export const createClientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  taxId: z.string().optional(),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientIdSchema = z.object({
  id: z.string().uuid('Invalid client ID'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
