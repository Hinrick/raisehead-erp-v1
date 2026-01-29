import { prisma } from '../../../config/database.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { SyncProvider, Contact, Prisma } from '@prisma/client';
import * as syncLogService from './sync-log.service.js';
import { resolveConflict } from './conflict-resolver.js';
import * as googleContacts from '../providers/google/google.contacts.js';
import * as outlookContacts from '../providers/outlook/outlook.contacts.js';
import * as notionContacts from '../providers/notion/notion.contacts.js';

interface ProviderAdapter {
  pushContact(contact: any, externalId?: string, databaseId?: string): Promise<{ externalId: string; externalData: Record<string, unknown> }>;
  pullContact(externalId: string): Promise<{ data: Record<string, unknown>; lastModified: Date | null }>;
  deleteContact(externalId: string): Promise<void>;
  fetchAllContacts(databaseId: string): Promise<Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }>>;
}

export interface InboundContext {
  tagId?: string;
  notionDatabaseId?: string;
}

function getAdapter(provider: SyncProvider): ProviderAdapter {
  switch (provider) {
    case 'GOOGLE':
      return googleContacts as unknown as ProviderAdapter;
    case 'OUTLOOK':
      return outlookContacts as unknown as ProviderAdapter;
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
 * Pushes changes to all linked external providers,
 * and creates new Notion links based on tag-to-database mappings.
 */
const contactRelationsInclude = {
  emails: true,
  phones: true,
  addresses: true,
  companies: {
    include: { company: true },
  },
};

export async function onContactChanged(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { ...contactRelationsInclude, externalLinks: true, tags: true },
  });

  if (!contact) return;

  // 1. Push updates to all existing external links
  for (const link of contact.externalLinks) {
    if (!(await isProviderEnabled(link.provider))) continue;

    try {
      const adapter = getAdapter(link.provider);
      const externalData = link.externalData as Record<string, unknown> | null;
      const dbId = externalData?._notionDatabaseId as string | undefined;
      const result = await adapter.pushContact(contact, link.externalId, dbId);

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

  // 2. Outbound tag-based routing for Notion
  if (await isProviderEnabled('NOTION')) {
    const contactTagIds = contact.tags.map((t) => t.tagId);
    const mappings = await prisma.notionDatabaseMapping.findMany({
      where: {
        enabled: true,
        OR: [
          { tagId: { in: contactTagIds } },
          { tagId: { equals: null } }, // global mapping — all contacts
        ],
      },
    });

    for (const mapping of mappings) {
      // Check if a Notion link for this database already exists
      const existingLink = contact.externalLinks.find((l) => {
        if (l.provider !== 'NOTION') return false;
        const data = l.externalData as Record<string, unknown> | null;
        return data?._notionDatabaseId === mapping.notionDatabaseId;
      });

      if (existingLink) continue; // already pushed above

      try {
        const result = await notionContacts.pushContact(contact, undefined, mapping.notionDatabaseId);

        const externalData = {
          ...result.externalData,
          _notionDatabaseId: mapping.notionDatabaseId,
        };

        await prisma.externalContactLink.create({
          data: {
            contactId: contact.id,
            provider: 'NOTION',
            externalId: result.externalId,
            externalData: externalData as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
          },
        });

        await syncLogService.createLog({
          provider: 'NOTION',
          direction: 'OUTBOUND',
          status: 'SYNCED',
          contactId: contact.id,
          externalId: result.externalId,
          message: `Contact pushed to Notion DB "${mapping.notionDatabaseName}" via ${mapping.tagId ? 'tag' : 'global'} mapping`,
          recordsProcessed: 1,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await syncLogService.createLog({
          provider: 'NOTION',
          direction: 'OUTBOUND',
          status: 'ERROR',
          contactId: contact.id,
          message: `Failed to push contact to Notion DB "${mapping.notionDatabaseName}"`,
          errorDetails: errorMsg,
        });
      }
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
    include: { ...contactRelationsInclude, externalLinks: true },
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
      ...contactRelationsInclude,
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
 * Optional context carries tag/database info for Notion multi-mapping.
 */
export async function handleInboundChange(
  provider: SyncProvider,
  externalId: string,
  externalData: Record<string, unknown>,
  lastModified: Date | null,
  context?: InboundContext,
) {
  // Enrich externalData with _notionDatabaseId for traceability
  const enrichedData = context?.notionDatabaseId
    ? { ...externalData, _notionDatabaseId: context.notionDatabaseId }
    : externalData;

  const link = await prisma.externalContactLink.findUnique({
    where: { provider_externalId: { provider, externalId } },
    include: { contact: true },
  });

  if (!link) {
    // New external contact — create locally
    const emailsData = externalData.emails as Array<{ value: string; label: string; primary: boolean }> | undefined;
    const phonesData = externalData.phones as Array<{ value: string; label: string; primary: boolean }> | undefined;
    const addressesData = externalData.addresses as Array<Record<string, unknown>> | undefined;

    const contact = await prisma.contact.create({
      data: {
        displayName: (externalData.displayName as string) || 'Unknown',
        email: (externalData.email as string) ?? null,
        phone: (externalData.phone as string) ?? null,
        address: (externalData.address as string) ?? null,
        firstName: (externalData.firstName as string) ?? null,
        lastName: (externalData.lastName as string) ?? null,
        middleName: (externalData.middleName as string) ?? null,
        namePrefix: (externalData.namePrefix as string) ?? null,
        nameSuffix: (externalData.nameSuffix as string) ?? null,
        nickname: (externalData.nickname as string) ?? null,
        birthday: externalData.birthday ? new Date(externalData.birthday as string) : null,
        gender: (externalData.gender as string) ?? null,
        taxId: (externalData.taxId as string) ?? null,
        ...(emailsData?.length ? { emails: { create: emailsData } } : {}),
        ...(phonesData?.length ? { phones: { create: phonesData } } : {}),
        ...(addressesData?.length
          ? {
              addresses: {
                create: addressesData.map((a) => ({
                  label: (a.label as string) || 'work',
                  primary: (a.primary as boolean) || false,
                  formattedValue: (a.formattedValue as string) || null,
                  street: (a.street as string) || null,
                  city: (a.city as string) || null,
                  state: (a.state as string) || null,
                  postalCode: (a.postalCode as string) || null,
                  country: (a.country as string) || null,
                  countryCode: (a.countryCode as string) || null,
                })),
              },
            }
          : {}),
        externalLinks: {
          create: {
            provider,
            externalId,
            externalData: enrichedData as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
          },
        },
        // Auto-assign tag from context
        ...(context?.tagId
          ? { tags: { create: { tagId: context.tagId } } }
          : {}),
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

  // Ensure tag is assigned for existing contact
  if (context?.tagId) {
    await prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId: link.contactId, tagId: context.tagId } },
      create: { contactId: link.contactId, tagId: context.tagId },
      update: {},
    });
  }

  // Existing contact — resolve conflict
  const resolution = resolveConflict(link.contact, lastModified, link);

  if (resolution.action === 'PULL_EXTERNAL') {
    const emailsData = externalData.emails as Array<{ value: string; label: string; primary: boolean }> | undefined;
    const phonesData = externalData.phones as Array<{ value: string; label: string; primary: boolean }> | undefined;
    const addressesData = externalData.addresses as Array<Record<string, unknown>> | undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.contact.update({
        where: { id: link.contactId },
        data: {
          displayName: (externalData.displayName as string) || link.contact.displayName,
          email: (externalData.email as string) ?? link.contact.email,
          phone: (externalData.phone as string) ?? link.contact.phone,
          address: (externalData.address as string) ?? link.contact.address,
          firstName: (externalData.firstName as string) ?? link.contact.firstName,
          lastName: (externalData.lastName as string) ?? link.contact.lastName,
          middleName: (externalData.middleName as string) ?? link.contact.middleName,
          namePrefix: (externalData.namePrefix as string) ?? link.contact.namePrefix,
          nameSuffix: (externalData.nameSuffix as string) ?? link.contact.nameSuffix,
          nickname: (externalData.nickname as string) ?? link.contact.nickname,
          birthday: externalData.birthday ? new Date(externalData.birthday as string) : link.contact.birthday,
          gender: (externalData.gender as string) ?? link.contact.gender,
          taxId: (externalData.taxId as string) ?? link.contact.taxId,
        },
      });

      if (emailsData?.length) {
        await tx.contactEmail.deleteMany({ where: { contactId: link.contactId } });
        await tx.contactEmail.createMany({
          data: emailsData.map((e) => ({ ...e, contactId: link.contactId })),
        });
      }
      if (phonesData?.length) {
        await tx.contactPhone.deleteMany({ where: { contactId: link.contactId } });
        await tx.contactPhone.createMany({
          data: phonesData.map((p) => ({ ...p, contactId: link.contactId })),
        });
      }
      if (addressesData?.length) {
        await tx.contactAddress.deleteMany({ where: { contactId: link.contactId } });
        await tx.contactAddress.createMany({
          data: addressesData.map((a) => ({
            contactId: link.contactId,
            label: (a.label as string) || 'work',
            primary: (a.primary as boolean) || false,
            formattedValue: (a.formattedValue as string) || null,
            street: (a.street as string) || null,
            city: (a.city as string) || null,
            state: (a.state as string) || null,
            postalCode: (a.postalCode as string) || null,
            country: (a.country as string) || null,
            countryCode: (a.countryCode as string) || null,
          })),
        });
      }

      return result;
    });

    await prisma.externalContactLink.update({
      where: { id: link.id },
      data: {
        externalData: enrichedData as Prisma.InputJsonValue,
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

  // Even if no data update, ensure externalData has _notionDatabaseId
  if (context?.notionDatabaseId) {
    const currentData = link.externalData as Record<string, unknown> | null;
    if (!currentData?._notionDatabaseId) {
      await prisma.externalContactLink.update({
        where: { id: link.id },
        data: {
          externalData: { ...(currentData || {}), _notionDatabaseId: context.notionDatabaseId } as Prisma.InputJsonValue,
        },
      });
    }
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

/**
 * Full sync for a single Notion database mapping.
 * Pulls all contacts from the Notion DB and pushes all local contacts with the mapped tag.
 */
export async function fullSyncNotionMapping(mappingId: string) {
  if (!(await isProviderEnabled('NOTION'))) {
    throw new AppError('NOTION integration is not enabled', 400);
  }

  const mapping = await prisma.notionDatabaseMapping.findUnique({
    where: { id: mappingId },
  });

  if (!mapping) {
    throw new AppError('Notion database mapping not found', 404);
  }

  let processed = 0;
  let errors = 0;

  // 0. Ensure the Notion database has all required properties
  try {
    const result = await notionContacts.ensureDatabaseProperties(mapping.notionDatabaseId);
    if (result.created.length > 0) {
      await syncLogService.createLog({
        provider: 'NOTION',
        direction: 'BOTH',
        status: 'SYNCED',
        message: `Created missing properties in Notion DB "${mapping.notionDatabaseName}": ${result.created.join(', ')}`,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await syncLogService.createLog({
      provider: 'NOTION',
      direction: 'BOTH',
      status: 'ERROR',
      message: `Failed to ensure properties in Notion DB "${mapping.notionDatabaseName}"`,
      errorDetails: errorMsg,
    });
    // Continue with sync anyway — existing properties may still work
  }

  // 1. Pull: fetch all contacts from Notion DB and sync inbound
  try {
    const externalContacts = await notionContacts.fetchAllContacts(mapping.notionDatabaseId);

    for (const external of externalContacts) {
      try {
        await handleInboundChange(
          'NOTION',
          external.externalId,
          external.data,
          external.lastModified,
          { tagId: mapping.tagId ?? undefined, notionDatabaseId: mapping.notionDatabaseId },
        );
        processed++;
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        await syncLogService.createLog({
          provider: 'NOTION',
          direction: 'INBOUND',
          status: 'ERROR',
          externalId: external.externalId,
          message: 'Failed to process inbound contact during full sync',
          errorDetails: errorMsg,
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await syncLogService.createLog({
      provider: 'NOTION',
      direction: 'INBOUND',
      status: 'ERROR',
      message: `Failed to fetch contacts from Notion DB "${mapping.notionDatabaseName}"`,
      errorDetails: errorMsg,
    });
  }

  // 2. Push: find local contacts to push to Notion DB
  //    If tagId is null (global mapping), push ALL contacts; otherwise filter by tag.
  const contactsWithTag = await prisma.contact.findMany({
    where: mapping.tagId
      ? { tags: { some: { tagId: mapping.tagId } } }
      : {},
    include: {
      ...contactRelationsInclude,
      externalLinks: {
        where: { provider: 'NOTION' },
      },
    },
  });

  for (const contact of contactsWithTag) {
    // Check if already linked to this specific Notion DB
    const existingLink = contact.externalLinks.find((l) => {
      const data = l.externalData as Record<string, unknown> | null;
      return data?._notionDatabaseId === mapping.notionDatabaseId;
    });

    try {
      if (existingLink) {
        // Update existing
        const result = await notionContacts.pushContact(contact, existingLink.externalId, mapping.notionDatabaseId);
        await prisma.externalContactLink.update({
          where: { id: existingLink.id },
          data: {
            externalData: { ...result.externalData, _notionDatabaseId: mapping.notionDatabaseId } as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
            syncError: null,
          },
        });
      } else {
        // Create new
        const result = await notionContacts.pushContact(contact, undefined, mapping.notionDatabaseId);
        await prisma.externalContactLink.create({
          data: {
            contactId: contact.id,
            provider: 'NOTION',
            externalId: result.externalId,
            externalData: { ...result.externalData, _notionDatabaseId: mapping.notionDatabaseId } as Prisma.InputJsonValue,
            lastSyncedAt: new Date(),
            syncStatus: 'SYNCED',
          },
        });
      }
      processed++;
    } catch (error) {
      errors++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      await syncLogService.createLog({
        provider: 'NOTION',
        direction: 'OUTBOUND',
        status: 'ERROR',
        contactId: contact.id,
        message: `Failed to push contact to Notion DB "${mapping.notionDatabaseName}"`,
        errorDetails: errorMsg,
      });
    }
  }

  await syncLogService.createLog({
    provider: 'NOTION',
    direction: 'BOTH',
    status: errors > 0 ? 'ERROR' : 'SYNCED',
    message: `Full sync for "${mapping.notionDatabaseName}" completed: ${processed} processed, ${errors} errors`,
    recordsProcessed: processed,
    errorDetails: errors > 0 ? `${errors} contacts failed to sync` : undefined,
  });

  return { processed, errors };
}
