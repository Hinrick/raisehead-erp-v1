import { prisma } from '../../../../config/database.js';
import * as notionContacts from './notion.contacts.js';
import * as syncService from '../../sync/sync.service.js';
import * as syncLogService from '../../sync/sync-log.service.js';

/**
 * Poll all enabled Notion database mappings for changes.
 * Called by node-cron every 5 minutes.
 * Notion doesn't support webhooks, so we poll for changes.
 */
export async function pollNotionChanges() {
  try {
    const integrationConfig = await prisma.integrationConfig.findUnique({
      where: { provider: 'NOTION' },
    });

    if (!integrationConfig?.enabled) {
      return;
    }

    // Query all enabled mappings
    const mappings = await prisma.notionDatabaseMapping.findMany({
      where: { enabled: true },
    });

    if (mappings.length === 0) {
      return;
    }

    for (const mapping of mappings) {
      try {
        const allContacts = await notionContacts.fetchAllContacts(mapping.notionDatabaseId);
        let processed = 0;

        for (const external of allContacts) {
          try {
            await syncService.handleInboundChange(
              'NOTION',
              external.externalId,
              external.data,
              external.lastModified,
              { tagId: mapping.tagId ?? undefined, notionDatabaseId: mapping.notionDatabaseId },
            );
            processed++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await syncLogService.createLog({
              provider: 'NOTION',
              direction: 'INBOUND',
              status: 'ERROR',
              externalId: external.externalId,
              message: `Failed to process Notion contact during poll (db: ${mapping.notionDatabaseName})`,
              errorDetails: errorMsg,
            });
          }
        }

        if (processed > 0) {
          await syncLogService.createLog({
            provider: 'NOTION',
            direction: 'INBOUND',
            status: 'SYNCED',
            message: `Notion poll completed for "${mapping.notionDatabaseName}": ${processed} contacts processed`,
            recordsProcessed: processed,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Notion polling failed for mapping "${mapping.notionDatabaseName}":`, errorMsg);
        await syncLogService.createLog({
          provider: 'NOTION',
          direction: 'INBOUND',
          status: 'ERROR',
          message: `Notion polling failed for "${mapping.notionDatabaseName}"`,
          errorDetails: errorMsg,
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Notion polling failed:', errorMsg);
    await syncLogService.createLog({
      provider: 'NOTION',
      direction: 'INBOUND',
      status: 'ERROR',
      message: 'Notion polling failed',
      errorDetails: errorMsg,
    });
  }
}
