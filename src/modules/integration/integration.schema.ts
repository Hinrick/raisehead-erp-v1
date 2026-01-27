import { z } from 'zod';

export const providerParamSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK', 'NOTION']),
});

export const upsertIntegrationSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type UpsertIntegrationInput = z.infer<typeof upsertIntegrationSchema>;
