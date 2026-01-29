import { prisma } from '../../../config/database.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { SyncProvider, Contact, Prisma } from '@prisma/client';
import * as syncLogService from './sync-log.service.js';
import { resolveConflict } from './conflict-resolver.js';
import * as googleContacts from '../providers/google/google.contacts.js';
import * as outlookContacts from '../providers/outlook/outlook.contacts.js';
import * as notionContacts from '../providers/notion/notion.contacts.js';

interface ProviderAdapter {
  pushContact(contact: Contact, externalId?: string): Promise<{ externalId: string; externalData: Record<string, unknown> }>;
  pullContact(externalId: string): Promise<{ data: Record<string, unknown>; lastModified: Date | null }>;
  deleteContact(externalId: string): Promise<void>;
  fetchAllContacts(): Promise<Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }>>;
}

function getAdapter(provider: SyncProvider): ProviderAdapter {
  switch (provider) {
    case 'GOOGLE':
      return googleContacts;
    case 'OUTLOOK':
      return outlookContacts;
    case 'NOTION':
      return notionContacts;
    default:
      throw new AppError(`Unknown provider: ${provider}`, 400);
  }
}

async function isProviderEnabled(provider: SyncProvider): Promise<boolean> {
  const config = await prisma.integrationConfig.findUnique({
    where: { provider },
  });
  return config?.enabled ?? false;
}

/**
 * Fired asynchronously after a contact is created/updated.
 * Pushes changes to all linked external providers.
 */
export async function onContactChanged(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { externalLinks: true },
  });

  if (!contact) return;

  for (const link of contact.externalLinks) {
    if (!(await isProviderEnabled(link.provider))) continue;

    try {
      const adapter = getAdapter(link.provider);
      const result = await adapter.pushContact(contact, link.externalId);

      await prisma.externalContactLink.update({
        where: { id: link.id },
        data: {
          externalId: result.externalId,
          externalData: result.externalData as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
          syncStatus: 'SYNCED',
          syncError: null,
        },
      });

      await syncLogService.createLog({
        provider: link.provider,
        direction: 'OUTBOUND',
        status: 'SYNCED',
        contactId: contact.id,
        externalId: result.externalId,
        message: 'Contact pushed to external provider',
        recordsProcessed: 1,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await prisma.externalContactLink.update({
        where: { id: link.id },
        data: {
          syncStatus: 'ERROR',
          syncError: errorMsg,
        },
      });

      await syncLogService.createLog({
        provider: link.provider,
        direction: 'OUTBOUND',
        status: 'ERROR',
        contactId: contact.id,
        externalId: link.externalId,
        message: 'Failed to push contact',
        errorDetails: errorMsg,
      });
    }
  }
}

/**
 * Sync a single contact to a specific provider.
 * Creates the external link if it doesn't exist.
 */
export async function syncSingleContact(provider: SyncProvider, contactId: string) {
  if (!(await isProviderEnabled(provider))) {
    throw new AppError(`${provider} integration is not enabled`, 400);
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { externalLinks: true },
  });

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  const adapter = getAdapter(provider);
  const existingLink = contact.externalLinks.find((l) => l.provider === provider);

  try {
    const result = await adapter.pushContact(contact, existingLink?.externalId);

    if (existingLink) {
      await prisma.externalContactLink.update({
        where: { id: existingLink.id },
        data: {
          externalId: result.externalId,
          externalData: result.externalData as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
          syncStatus: 'SYNCED',
          syncError: null,
        },
      });
    } else {
      await prisma.externalContactLink.create({
        data: {
          contactId: contact.id,
          provider,
          externalId: result.externalId,
          externalData: result.externalData as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
          syncStatus: 'SYNCED',
        },
      });
    }

    await syncLogService.createLog({
      provider,
      direction: 'OUTBOUND',
      status: 'SYNCED',
      contactId: contact.id,
      externalId: result.externalId,
      message: 'Single contact synced',
      recordsProcessed: 1,
    });

    return { success: true, externalId: result.externalId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await syncLogService.createLog({
      provider,
      direction: 'OUTBOUND',
      status: 'ERROR',
      contactId: contact.id,
      message: 'Failed to sync single contact',
      errorDetails: errorMsg,
    });

    throw new AppError(`Sync failed: ${errorMsg}`, 500);
  }
}

/**
 * Full sync for a provider: push all local contacts, pull all external contacts.
 */
export async function fullSync(provider: SyncProvider) {
  if (!(await isProviderEnabled(provider))) {
    throw new AppError(`${provider} integration is not enabled`, 400);
  }

  const adapter = getAdapter(provider);
  let processed = 0;
  let errors = 0;

  // Push all local contacts that have links to this provider
  const linkedContacts = await prisma.contact.findMany({
    include: {
      externalLinks: {
        where: { provider },
      },
    },
  });

  for (const contact of linkedContacts) {
    const link = contact.externalLinks[0];
    if (!link) continue;

    try {
      const external = await adapter.pullContact(link.externalId);
      const resolution = resolveConflict(contact, external.lastModified, link);

      if (resolution.action === 'PUSH_LOCAL') {
        const result = await adapter.pushContact(contact, link.externalId);
        await prisma.externalContactLink.update({
          where: { id: link.id },
          data: {
            externalData: result.externalData as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
            syncError: null,
          },
        });
      } else if (resolution.action === 'PULL_EXTERNAL') {
        const { data } = external;
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            displayName: (data.displayName as string) || contact.displayName,
            email: (data.email as string) || contact.email,
            phone: (data.phone as string) || contact.phone,
          },
        });
        await prisma.externalContactLink.update({
          where: { id: link.id },
          data: {
            externalData: data as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
            syncError: null,
          },
        });
      }

      processed++;
    } catch (error) {
      errors++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      await prisma.externalContactLink.update({
        where: { id: link.id },
        data: { syncStatus: 'ERROR', syncError: errorMsg },
      });
    }
  }

  await syncLogService.createLog({
    provider,
    direction: 'BOTH',
    status: errors > 0 ? 'ERROR' : 'SYNCED',
    message: `Full sync completed: ${processed} processed, ${errors} errors`,
    recordsProcessed: processed,
    errorDetails: errors > 0 ? `${errors} contacts failed to sync` : undefined,
  });

  return { processed, errors };
}

/**
 * Handle inbound changes from external provider (webhook/poll).
 */
export async function handleInboundChange(
  provider: SyncProvider,
  externalId: string,
  externalData: Record<string, unknown>,
  lastModified: Date | null,
) {
  const link = await prisma.externalContactLink.findUnique({
    where: { provider_externalId: { provider, externalId } },
    include: { contact: true },
  });

  if (!link) {
    // New external contact — create locally
    const contact = await prisma.contact.create({
      data: {
        displayName: (externalData.displayName as string) || 'Unknown',
        email: externalData.email as string || null,
        phone: externalData.phone as string || null,
        firstName: externalData.firstName as string || null,
        lastName: externalData.lastName as string || null,
        externalLinks: {
          create: {
            provider,
            externalId,
            externalData: externalData as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
          },
        },
      },
    });

    await syncLogService.createLog({
      provider,
      direction: 'INBOUND',
      status: 'SYNCED',
      contactId: contact.id,
      externalId,
      message: 'New contact created from external source',
      recordsProcessed: 1,
    });

    return contact;
  }

  // Existing contact — resolve conflict
  const resolution = resolveConflict(link.contact, lastModified, link);

  if (resolution.action === 'PULL_EXTERNAL') {
    const updated = await prisma.contact.update({
      where: { id: link.contactId },
      data: {
        displayName: (externalData.displayName as string) || link.contact.displayName,
        email: (externalData.email as string) || link.contact.email,
        phone: (externalData.phone as string) || link.contact.phone,
        firstName: (externalData.firstName as string) || link.contact.firstName,
        lastName: (externalData.lastName as string) || link.contact.lastName,
      },
    });

    await prisma.externalContactLink.update({
      where: { id: link.id },
      data: {
        externalData: externalData as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
        syncError: null,
      },
    });

    await syncLogService.createLog({
      provider,
      direction: 'INBOUND',
      status: 'SYNCED',
      contactId: link.contactId,
      externalId,
      message: `Contact updated from external source: ${resolution.reason}`,
      recordsProcessed: 1,
    });

    return updated;
  }

  await syncLogService.createLog({
    provider,
    direction: 'INBOUND',
    status: 'SYNCED',
    contactId: link.contactId,
    externalId,
    message: `No update needed: ${resolution.reason}`,
  });

  return link.contact;
}
