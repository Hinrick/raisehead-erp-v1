import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { CreateCompanyInput, UpdateCompanyInput } from './company.schema.js';

export async function findAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      skip,
      take: limit,
      include: {
        _count: { select: { contacts: true, quotations: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.company.count(),
  ]);

  return {
    companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findById(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: {
        include: {
          contact: {
            select: {
              id: true,
              displayName: true,
              email: true,
              phone: true,
            },
          },
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
    },
  });

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  return company;
}

export async function create(input: CreateCompanyInput) {
  return prisma.company.create({
    data: {
      name: input.name,
      taxId: input.taxId || null,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      fax: input.fax || null,
      industry: input.industry || null,
      notes: input.notes || null,
    },
    include: {
      _count: { select: { contacts: true, quotations: true } },
    },
  });
}

export async function update(id: string, input: UpdateCompanyInput) {
  await findById(id);

  return prisma.company.update({
    where: { id },
    data: input,
    include: {
      _count: { select: { contacts: true, quotations: true } },
    },
  });
}

export async function remove(id: string) {
  await findById(id);

  const quotationCount = await prisma.quotation.count({
    where: { companyId: id },
  });

  if (quotationCount > 0) {
    throw new AppError(
      `Cannot delete company with ${quotationCount} quotation(s). Delete quotations first.`,
      400,
    );
  }

  return prisma.company.delete({ where: { id } });
}

export async function search(query: string) {
  return prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { taxId: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      _count: { select: { contacts: true, quotations: true } },
    },
    take: 10,
    orderBy: { name: 'asc' },
  });
}
