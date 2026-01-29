import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateContactInput, UpdateContactInput } from './contact.schema.js';
import { onContactChanged } from '../integration/sync/sync.service.js';

const multiValueInclude = {
  emails: true,
  phones: true,
  addresses: true,
};

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
        ...multiValueInclude,
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
      ...multiValueInclude,
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
  const { emails, phones, addresses, birthday, ...scalarFields } = input;

  const contact = await prisma.contact.create({
    data: {
      displayName: scalarFields.displayName,
      email: scalarFields.email || null,
      phone: scalarFields.phone || null,
      address: scalarFields.address || null,
      notes: scalarFields.notes || null,
      firstName: scalarFields.firstName || null,
      lastName: scalarFields.lastName || null,
      middleName: scalarFields.middleName || null,
      namePrefix: scalarFields.namePrefix || null,
      nameSuffix: scalarFields.nameSuffix || null,
      nickname: scalarFields.nickname || null,
      birthday: birthday ? new Date(birthday) : null,
      gender: scalarFields.gender || null,
      taxId: scalarFields.taxId || null,
      ...(emails?.length ? { emails: { create: emails } } : {}),
      ...(phones?.length ? { phones: { create: phones } } : {}),
      ...(addresses?.length ? { addresses: { create: addresses } } : {}),
    },
    include: {
      ...multiValueInclude,
      tags: { include: { tag: true } },
      companies: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
    },
  });

  await syncPrimaryFields(contact.id);

  return findById(contact.id).catch(() => contact);
}

export async function update(id: string, input: UpdateContactInput) {
  await findById(id);

  const { emails, phones, addresses, birthday, ...scalarFields } = input;

  const data: Record<string, unknown> = { ...scalarFields };
  if (birthday !== undefined) {
    data.birthday = birthday ? new Date(birthday) : null;
  }
  // Remove nested arrays from data passed directly to contact update
  delete data.emails;
  delete data.phones;
  delete data.addresses;

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({ where: { id }, data });

    if (emails !== undefined) {
      await tx.contactEmail.deleteMany({ where: { contactId: id } });
      if (emails.length > 0) {
        await tx.contactEmail.createMany({
          data: emails.map((e) => ({ ...e, contactId: id })),
        });
      }
    }

    if (phones !== undefined) {
      await tx.contactPhone.deleteMany({ where: { contactId: id } });
      if (phones.length > 0) {
        await tx.contactPhone.createMany({
          data: phones.map((p) => ({ ...p, contactId: id })),
        });
      }
    }

    if (addresses !== undefined) {
      await tx.contactAddress.deleteMany({ where: { contactId: id } });
      if (addresses.length > 0) {
        await tx.contactAddress.createMany({
          data: addresses.map((a) => ({ ...a, contactId: id })),
        });
      }
    }
  });

  await syncPrimaryFields(id);

  return findById(id);
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
        { emails: { some: { value: { contains: query, mode: 'insensitive' } } } },
      ],
    },
    include: {
      ...multiValueInclude,
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

  // Fire outbound sync non-blocking (tag change may trigger Notion push)
  onContactChanged(contactId).catch(() => {});

  return findById(contactId);
}

export async function removeTag(contactId: string, tagId: string) {
  await findById(contactId);

  await prisma.contactTag.delete({
    where: { contactId_tagId: { contactId, tagId } },
  }).catch(() => {
    throw new AppError('Tag not found on this contact', 404);
  });

  // Fire outbound sync non-blocking (tag removal may affect Notion links)
  onContactChanged(contactId).catch(() => {});

  return findById(contactId);
}

export async function addCompany(contactId: string, companyId: string, jobTitle?: string, department?: string) {
  await findById(contactId);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  await prisma.contactCompany.create({
    data: { contactId, companyId, jobTitle: jobTitle || null, department: department || null },
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

/**
 * Syncs primary email/phone/address from multi-value tables
 * back to the legacy scalar columns on Contact.
 */
export async function syncPrimaryFields(contactId: string) {
  const [primaryEmail, primaryPhone, primaryAddress] = await Promise.all([
    prisma.contactEmail.findFirst({ where: { contactId, primary: true } }),
    prisma.contactPhone.findFirst({ where: { contactId, primary: true } }),
    prisma.contactAddress.findFirst({ where: { contactId, primary: true } }),
  ]);

  const updates: Record<string, string | null> = {};

  if (primaryEmail) {
    updates.email = primaryEmail.value;
  }
  if (primaryPhone) {
    updates.phone = primaryPhone.value;
  }
  if (primaryAddress) {
    updates.address = primaryAddress.formattedValue
      || [primaryAddress.street, primaryAddress.city, primaryAddress.state, primaryAddress.postalCode, primaryAddress.country]
          .filter(Boolean).join(', ')
      || null;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.contact.update({
      where: { id: contactId },
      data: updates,
    });
  }
}
