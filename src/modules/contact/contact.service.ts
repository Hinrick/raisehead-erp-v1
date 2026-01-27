import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateContactInput, UpdateContactInput } from './contact.schema.js';

export async function findAll(
  page = 1,
  limit = 20,
  type?: 'PERSON' | 'COMPANY',
  tagId?: string,
) {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (tagId) {
    where.tags = { some: { tagId } };
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      skip,
      take: limit,
      where,
      include: {
        tags: { include: { tag: true } },
        company: { select: { id: true, displayName: true } },
        _count: { select: { members: true, quotations: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findById(id: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      company: { select: { id: true, displayName: true } },
      members: {
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          jobTitle: true,
        },
      },
      quotations: {
        select: {
          id: true,
          quotationNumber: true,
          projectName: true,
          status: true,
          discountedTotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      externalLinks: {
        select: {
          id: true,
          provider: true,
          externalId: true,
          lastSyncedAt: true,
          syncStatus: true,
          syncError: true,
        },
      },
    },
  });

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  return contact;
}

export async function create(input: CreateContactInput) {
  if (input.companyId) {
    const company = await prisma.contact.findUnique({
      where: { id: input.companyId },
    });
    if (!company || company.type !== 'COMPANY') {
      throw new AppError('Company not found or is not a COMPANY type contact', 400);
    }
  }

  return prisma.contact.create({
    data: {
      type: input.type,
      displayName: input.displayName,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      notes: input.notes || null,
      taxId: input.taxId || null,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      jobTitle: input.jobTitle || null,
      companyId: input.companyId || null,
    },
    include: {
      tags: { include: { tag: true } },
      company: { select: { id: true, displayName: true } },
    },
  });
}

export async function update(id: string, input: UpdateContactInput) {
  await findById(id);

  if (input.companyId) {
    const company = await prisma.contact.findUnique({
      where: { id: input.companyId },
    });
    if (!company || company.type !== 'COMPANY') {
      throw new AppError('Company not found or is not a COMPANY type contact', 400);
    }
  }

  return prisma.contact.update({
    where: { id },
    data: input,
    include: {
      tags: { include: { tag: true } },
      company: { select: { id: true, displayName: true } },
    },
  });
}

export async function remove(id: string) {
  await findById(id);

  const quotationCount = await prisma.quotation.count({
    where: { contactId: id },
  });

  if (quotationCount > 0) {
    throw new AppError(
      `Cannot delete contact with ${quotationCount} quotation(s). Delete quotations first.`,
      400,
    );
  }

  return prisma.contact.delete({ where: { id } });
}

export async function search(query: string) {
  return prisma.contact.findMany({
    where: {
      OR: [
        { displayName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { taxId: { contains: query } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      tags: { include: { tag: true } },
      company: { select: { id: true, displayName: true } },
    },
    take: 10,
    orderBy: { displayName: 'asc' },
  });
}

export async function addTags(contactId: string, tagIds: string[]) {
  await findById(contactId);

  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
  });
  if (tags.length !== tagIds.length) {
    throw new AppError('One or more tags not found', 404);
  }

  await prisma.contactTag.createMany({
    data: tagIds.map((tagId) => ({ contactId, tagId })),
    skipDuplicates: true,
  });

  return findById(contactId);
}

export async function removeTag(contactId: string, tagId: string) {
  await findById(contactId);

  await prisma.contactTag.delete({
    where: { contactId_tagId: { contactId, tagId } },
  }).catch(() => {
    throw new AppError('Tag not found on this contact', 404);
  });

  return findById(contactId);
}

export async function getMembers(companyId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: companyId },
  });

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  if (contact.type !== 'COMPANY') {
    throw new AppError('Contact is not a company', 400);
  }

  return prisma.contact.findMany({
    where: { companyId },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { displayName: 'asc' },
  });
}

export async function updateNameCard(contactId: string, relativePath: string) {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  // Delete old file if exists
  if (contact.nameCardPath) {
    const oldAbsolute = path.resolve(contact.nameCardPath);
    fs.unlink(oldAbsolute, () => {});
  }

  return prisma.contact.update({
    where: { id: contactId },
    data: { nameCardPath: relativePath },
  });
}

export async function removeNameCard(contactId: string) {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }
  if (!contact.nameCardPath) {
    throw new AppError('No name card image found', 404);
  }

  const absolute = path.resolve(contact.nameCardPath);
  fs.unlink(absolute, () => {});

  return prisma.contact.update({
    where: { id: contactId },
    data: { nameCardPath: null },
  });
}
