import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateClientInput, UpdateClientInput } from './client.schema.js';

export async function findAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count(),
  ]);

  return {
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
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
    },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  return client;
}

export async function create(input: CreateClientInput) {
  return prisma.client.create({
    data: {
      companyName: input.companyName,
      taxId: input.taxId || null,
      contactName: input.contactName,
      email: input.email || null,
      address: input.address || null,
      phone: input.phone || null,
    },
  });
}

export async function update(id: string, input: UpdateClientInput) {
  await findById(id); // Check if exists

  return prisma.client.update({
    where: { id },
    data: input,
  });
}

export async function remove(id: string) {
  await findById(id); // Check if exists

  // Check if client has quotations
  const quotationCount = await prisma.quotation.count({
    where: { clientId: id },
  });

  if (quotationCount > 0) {
    throw new AppError(
      `Cannot delete client with ${quotationCount} quotation(s). Delete quotations first.`,
      400
    );
  }

  return prisma.client.delete({
    where: { id },
  });
}

export async function search(query: string) {
  return prisma.client.findMany({
    where: {
      OR: [
        { companyName: { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } },
        { taxId: { contains: query } },
      ],
    },
    take: 10,
    orderBy: { companyName: 'asc' },
  });
}
