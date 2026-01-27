import { z } from 'zod';

export const syncProviderParamSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK', 'NOTION']),
});

export const syncContactParamSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK', 'NOTION']),
  contactId: z.string().uuid('Invalid contact ID'),
});

export const syncLogsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  provider: z.enum(['GOOGLE', 'OUTLOOK', 'NOTION']).optional(),
});
