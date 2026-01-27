import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateQuotationInput, UpdateQuotationInput } from './quotation.schema.js';

export async function findAll(page = 1, limit = 20, status?: string) {
  const skip = (page - 1) * limit;

  const where = status ? { status: status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' } : {};

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      skip,
      take: limit,
      where,
      include: {
        contact: {
          select: {
            id: true,
            displayName: true,
            type: true,
          },
        },
        contactPerson: {
          select: {
            id: true,
            displayName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quotation.count({ where }),
  ]);

  return {
    quotations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findById(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      contact: true,
      contactPerson: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        orderBy: { itemNumber: 'asc' },
      },
      paymentTerms: {
        orderBy: { sortOrder: 'asc' },
      },
      notes: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  return quotation;
}

export async function create(input: CreateQuotationInput, userId: string) {
  // Check if quotation number already exists
  const existing = await prisma.quotation.findUnique({
    where: { quotationNumber: input.quotationNumber },
  });

  if (existing) {
    throw new AppError('Quotation number already exists', 409);
  }

  // Check if contact exists
  const contact = await prisma.contact.findUnique({
    where: { id: input.contactId },
  });

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  // Check contact person if provided
  if (input.contactPersonId) {
    const person = await prisma.contact.findUnique({
      where: { id: input.contactPersonId },
    });
    if (!person || person.type !== 'PERSON') {
      throw new AppError('Contact person not found or is not a PERSON type', 400);
    }
  }

  return prisma.quotation.create({
    data: {
      quotationNumber: input.quotationNumber,
      projectName: input.projectName,
      quotationDate: new Date(input.quotationDate),
      contactId: input.contactId,
      contactPersonId: input.contactPersonId || null,
      createdById: userId,
      originalTotal: new Decimal(input.originalTotal),
      discountedTotal: new Decimal(input.discountedTotal),
      taxIncluded: input.taxIncluded,
      paymentTerms: {
        create: (input.paymentTerms ?? []).map((content, i) => ({
          content,
          sortOrder: i + 1,
        })),
      },
      notes: {
        create: (input.notes ?? []).map((content, i) => ({
          content,
          sortOrder: i + 1,
        })),
      },
      items: {
        create: input.items.map((item) => ({
          itemNumber: item.itemNumber,
          description: item.description,
          details: item.details,
          amount: new Decimal(item.amount),
        })),
      },
    },
    include: {
      contact: true,
      contactPerson: true,
      items: {
        orderBy: { itemNumber: 'asc' },
      },
      paymentTerms: {
        orderBy: { sortOrder: 'asc' },
      },
      notes: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function update(id: string, input: UpdateQuotationInput) {
  const quotation = await findById(id);

  // Check if new quotation number conflicts
  if (input.quotationNumber && input.quotationNumber !== quotation.quotationNumber) {
    const existing = await prisma.quotation.findUnique({
      where: { quotationNumber: input.quotationNumber },
    });
    if (existing) {
      throw new AppError('Quotation number already exists', 409);
    }
  }

  // Delete-and-recreate for nested relations when provided
  const deleteOps = [];
  if (input.items) {
    deleteOps.push(prisma.quotationItem.deleteMany({ where: { quotationId: id } }));
  }
  if (input.paymentTerms) {
    deleteOps.push(prisma.paymentTerm.deleteMany({ where: { quotationId: id } }));
  }
  if (input.notes) {
    deleteOps.push(prisma.quotationNote.deleteMany({ where: { quotationId: id } }));
  }
  if (deleteOps.length > 0) {
    await Promise.all(deleteOps);
  }

  return prisma.quotation.update({
    where: { id },
    data: {
      ...(input.quotationNumber && { quotationNumber: input.quotationNumber }),
      ...(input.projectName && { projectName: input.projectName }),
      ...(input.quotationDate && { quotationDate: new Date(input.quotationDate) }),
      ...(input.contactId && { contactId: input.contactId }),
      ...(input.contactPersonId !== undefined && { contactPersonId: input.contactPersonId || null }),
      ...(input.originalTotal !== undefined && { originalTotal: new Decimal(input.originalTotal) }),
      ...(input.discountedTotal !== undefined && { discountedTotal: new Decimal(input.discountedTotal) }),
      ...(input.taxIncluded !== undefined && { taxIncluded: input.taxIncluded }),
      ...(input.status && { status: input.status }),
      ...(input.items && {
        items: {
          create: input.items.map((item) => ({
            itemNumber: item.itemNumber,
            description: item.description,
            details: item.details,
            amount: new Decimal(item.amount),
          })),
        },
      }),
      ...(input.paymentTerms && {
        paymentTerms: {
          create: input.paymentTerms.map((content, i) => ({
            content,
            sortOrder: i + 1,
          })),
        },
      }),
      ...(input.notes && {
        notes: {
          create: input.notes.map((content, i) => ({
            content,
            sortOrder: i + 1,
          })),
        },
      }),
    },
    include: {
      contact: true,
      contactPerson: true,
      items: {
        orderBy: { itemNumber: 'asc' },
      },
      paymentTerms: {
        orderBy: { sortOrder: 'asc' },
      },
      notes: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function remove(id: string) {
  await findById(id); // Check if exists

  return prisma.quotation.delete({
    where: { id },
  });
}

export async function updateStatus(id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED') {
  await findById(id); // Check if exists

  return prisma.quotation.update({
    where: { id },
    data: { status },
  });
}

export async function getNextQuotationNumber() {
  const lastQuotation = await prisma.quotation.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { quotationNumber: true },
  });

  if (!lastQuotation) {
    return '#001';
  }

  // Extract number from format like "#140"
  const match = lastQuotation.quotationNumber.match(/#(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `#${nextNum.toString().padStart(3, '0')}`;
  }

  return `#${Date.now()}`;
}
