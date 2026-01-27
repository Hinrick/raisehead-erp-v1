import { prisma } from '../../../../config/database.js';
import * as notionContacts from './notion.contacts.js';
import * as syncService from '../../sync/sync.service.js';
import * as syncLogService from '../../sync/sync-log.service.js';

/**
 * Poll Notion database for changes.
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

    const allContacts = await notionContacts.fetchAllContacts();
    let processed = 0;

    for (const external of allContacts) {
      try {
        await syncService.handleInboundChange(
          'NOTION',
          external.externalId,
          external.data,
          external.lastModified,
        );
        processed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await syncLogService.createLog({
          provider: 'NOTION',
          direction: 'INBOUND',
          status: 'ERROR',
          externalId: external.externalId,
          message: 'Failed to process Notion contact during poll',
          errorDetails: errorMsg,
        });
      }
    }

    if (processed > 0) {
      await syncLogService.createLog({
        provider: 'NOTION',
        direction: 'INBOUND',
        status: 'SYNCED',
        message: `Notion poll completed: ${processed} contacts processed`,
        recordsProcessed: processed,
      });
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
