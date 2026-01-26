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
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
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
      client: true,
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

  // Check if client exists
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  return prisma.quotation.create({
    data: {
      quotationNumber: input.quotationNumber,
      projectName: input.projectName,
      quotationDate: new Date(input.quotationDate),
      clientId: input.clientId,
      createdById: userId,
      originalTotal: new Decimal(input.originalTotal),
      discountedTotal: new Decimal(input.discountedTotal),
      taxIncluded: input.taxIncluded,
      paymentTerms: input.paymentTerms,
      notes: input.notes,
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
      client: true,
      items: {
        orderBy: { itemNumber: 'asc' },
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

  // If updating items, delete existing and create new
  if (input.items) {
    await prisma.quotationItem.deleteMany({
      where: { quotationId: id },
    });
  }

  return prisma.quotation.update({
    where: { id },
    data: {
      ...(input.quotationNumber && { quotationNumber: input.quotationNumber }),
      ...(input.projectName && { projectName: input.projectName }),
      ...(input.quotationDate && { quotationDate: new Date(input.quotationDate) }),
      ...(input.clientId && { clientId: input.clientId }),
      ...(input.originalTotal !== undefined && { originalTotal: new Decimal(input.originalTotal) }),
      ...(input.discountedTotal !== undefined && { discountedTotal: new Decimal(input.discountedTotal) }),
      ...(input.taxIncluded !== undefined && { taxIncluded: input.taxIncluded }),
      ...(input.paymentTerms !== undefined && { paymentTerms: input.paymentTerms }),
      ...(input.notes !== undefined && { notes: input.notes }),
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
    },
    include: {
      client: true,
      items: {
        orderBy: { itemNumber: 'asc' },
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
