import { z } from 'zod';

export const createNotionMappingSchema = z.object({
  notionDatabaseId: z.string().min(1, 'Notion database ID is required'),
  notionDatabaseName: z.string().min(1, 'Notion database name is required'),
  tagId: z.string().uuid('Invalid tag ID').nullable().optional(),
  enabled: z.boolean().optional(),
});

export const updateNotionMappingSchema = z.object({
  notionDatabaseName: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export const mappingIdSchema = z.object({
  mappingId: z.string().uuid('Invalid mapping ID'),
});

export type CreateNotionMappingInput = z.infer<typeof createNotionMappingSchema>;
export type UpdateNotionMappingInput = z.infer<typeof updateNotionMappingSchema>;
