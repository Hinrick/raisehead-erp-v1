import { z } from 'zod';

export const oauthProviderParamSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK']),
});

export const disconnectProviderParamSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK', 'NOTION']),
});
