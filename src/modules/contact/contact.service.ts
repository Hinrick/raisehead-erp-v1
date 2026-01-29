import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateContactInput, UpdateContactInput } from './contact.schema.js';

export async function findAll(
  page = 1,
  limit = 20,
  tagId?: string,
) {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
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
        companies: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
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
      companies: {
        include: { company: true },
      },
      personQuotations: {
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
  return prisma.contact.create({
    data: {
      displayName: input.displayName,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      notes: input.notes || null,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
    },
    include: {
      tags: { include: { tag: true } },
      companies: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function update(id: string, input: UpdateContactInput) {
  await findById(id);

  return prisma.contact.update({
    where: { id },
    data: input,
    include: {
      tags: { include: { tag: true } },
      companies: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function remove(id: string) {
  await findById(id);

  const quotationCount = await prisma.quotation.count({
    where: { contactPersonId: id },
  });

  if (quotationCount > 0) {
    throw new AppError(
      `Cannot delete contact with ${quotationCount} quotation(s). Remove contact from quotations first.`,
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
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      tags: { include: { tag: true } },
      companies: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
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

export async function addCompany(contactId: string, companyId: string, jobTitle?: string) {
  await findById(contactId);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  await prisma.contactCompany.create({
    data: { contactId, companyId, jobTitle: jobTitle || null },
  }).catch(() => {
    throw new AppError('Contact is already associated with this company', 409);
  });

  return findById(contactId);
}

export async function removeCompany(contactId: string, companyId: string) {
  await findById(contactId);

  await prisma.contactCompany.delete({
    where: { contactId_companyId: { contactId, companyId } },
  }).catch(() => {
    throw new AppError('Company association not found on this contact', 404);
  });

  return findById(contactId);
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
