import { prisma } from '../../../config/database.js';
import type { SyncProvider, SyncDirection, SyncStatus } from '@prisma/client';

export async function createLog(data: {
  provider: SyncProvider;
  direction: SyncDirection;
  status: SyncStatus;
  contactId?: string;
  externalId?: string;
  message?: string;
  errorDetails?: string;
  recordsProcessed?: number;
}) {
  return prisma.syncLog.create({
    data: {
      provider: data.provider,
      direction: data.direction,
      status: data.status,
      contactId: data.contactId || null,
      externalId: data.externalId || null,
      message: data.message || null,
      errorDetails: data.errorDetails || null,
      recordsProcessed: data.recordsProcessed || 0,
    },
  });
}

export async function findAll(page = 1, limit = 50, provider?: SyncProvider) {
  const skip = (page - 1) * limit;
  const where = provider ? { provider } : {};

  const [logs, total] = await Promise.all([
    prisma.syncLog.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.syncLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
