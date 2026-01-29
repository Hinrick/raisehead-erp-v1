import { prisma } from '../../../../config/database.js';
import { AppError } from '../../../../shared/middleware/error-handler.js';
import type { CreateNotionMappingInput, UpdateNotionMappingInput } from './notion-mapping.schema.js';

export async function findAll() {
  return prisma.notionDatabaseMapping.findMany({
    include: { tag: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findById(id: string) {
  const mapping = await prisma.notionDatabaseMapping.findUnique({
    where: { id },
    include: { tag: true },
  });
  if (!mapping) {
    throw new AppError('Notion database mapping not found', 404);
  }
  return mapping;
}

export async function create(input: CreateNotionMappingInput) {
  const tagId = input.tagId ?? null;

  if (tagId) {
    // Verify tag exists
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    // Check tag not already mapped (unique constraint will also catch this)
    const existingByTag = await prisma.notionDatabaseMapping.findUnique({
      where: { tagId },
    });
    if (existingByTag) {
      throw new AppError('This tag is already mapped to a Notion database', 409);
    }
  }

  // Check database ID not already mapped
  const existingByDb = await prisma.notionDatabaseMapping.findUnique({
    where: { notionDatabaseId: input.notionDatabaseId },
  });
  if (existingByDb) {
    throw new AppError('This Notion database is already mapped', 409);
  }

  return prisma.notionDatabaseMapping.create({
    data: {
      notionDatabaseId: input.notionDatabaseId,
      notionDatabaseName: input.notionDatabaseName,
      ...(tagId ? { tagId } : {}),
      enabled: input.enabled ?? true,
    },
    include: { tag: true },
  });
}

export async function update(id: string, input: UpdateNotionMappingInput) {
  await findById(id);
  return prisma.notionDatabaseMapping.update({
    where: { id },
    data: input,
    include: { tag: true },
  });
}

export async function remove(id: string) {
  const mapping = await findById(id);

  // Clean up ExternalContactLinks that reference this Notion database
  // Find links whose externalData contains _notionDatabaseId matching this mapping
  // We delete links for contacts that were synced through this mapping
  await prisma.externalContactLink.deleteMany({
    where: {
      provider: 'NOTION',
      externalData: {
        path: ['_notionDatabaseId'],
        equals: mapping.notionDatabaseId,
      },
    },
  });

  return prisma.notionDatabaseMapping.delete({ where: { id } });
}

export async function enable(id: string) {
  await findById(id);
  return prisma.notionDatabaseMapping.update({
    where: { id },
    data: { enabled: true },
    include: { tag: true },
  });
}

export async function disable(id: string) {
  await findById(id);
  return prisma.notionDatabaseMapping.update({
    where: { id },
    data: { enabled: false },
    include: { tag: true },
  });
}
