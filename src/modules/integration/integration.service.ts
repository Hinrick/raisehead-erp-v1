import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { SyncProvider, Prisma } from '@prisma/client';
import type { UpsertIntegrationInput } from './integration.schema.js';

export async function findAll() {
  return prisma.integrationConfig.findMany({
    orderBy: { provider: 'asc' },
  });
}

export async function findByProvider(provider: SyncProvider) {
  const config = await prisma.integrationConfig.findUnique({
    where: { provider },
  });

  if (!config) {
    throw new AppError(`Integration config for ${provider} not found`, 404);
  }

  return config;
}

export async function upsert(provider: SyncProvider, input: UpsertIntegrationInput) {
  return prisma.integrationConfig.upsert({
    where: { provider },
    create: {
      provider,
      enabled: input.enabled ?? false,
      config: (input.config ?? {}) as Prisma.InputJsonValue,
    },
    update: {
      ...(input.enabled !== undefined && { enabled: input.enabled }),
      ...(input.config !== undefined && { config: input.config as Prisma.InputJsonValue }),
    },
  });
}

export async function enable(provider: SyncProvider) {
  return prisma.integrationConfig.upsert({
    where: { provider },
    create: { provider, enabled: true },
    update: { enabled: true },
  });
}

export async function disable(provider: SyncProvider) {
  return prisma.integrationConfig.upsert({
    where: { provider },
    create: { provider, enabled: false },
    update: { enabled: false },
  });
}
