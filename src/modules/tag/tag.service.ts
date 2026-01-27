import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateTagInput, UpdateTagInput } from './tag.schema.js';

export async function findAll() {
  return prisma.tag.findMany({
    include: {
      _count: { select: { contacts: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function findById(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      _count: { select: { contacts: true } },
    },
  });

  if (!tag) {
    throw new AppError('Tag not found', 404);
  }

  return tag;
}

export async function create(input: CreateTagInput) {
  return prisma.tag.create({
    data: {
      name: input.name,
      color: input.color || '#6D28D9',
    },
  });
}

export async function update(id: string, input: UpdateTagInput) {
  await findById(id);

  return prisma.tag.update({
    where: { id },
    data: input,
  });
}

export async function remove(id: string) {
  await findById(id);

  return prisma.tag.delete({ where: { id } });
}
