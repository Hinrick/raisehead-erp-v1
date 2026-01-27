import type { Request, Response } from 'express';
import { prisma } from '../../../../config/database.js';
import * as syncService from '../../sync/sync.service.js';
import * as syncLogService from '../../sync/sync-log.service.js';
import { pullContact } from './outlook.contacts.js';

/**
 * Handle Microsoft Graph change notification.
 * Microsoft sends a POST when contacts change.
 */
export async function handleOutlookWebhook(req: Request, res: Response) {
  // Validation request: Microsoft sends a validation token on subscription creation
  if (req.query.validationToken) {
    res.status(200).contentType('text/plain').send(req.query.validationToken as string);
    return;
  }

  // Acknowledge immediately
  res.status(202).send();

  try {
    const notifications = req.body?.value;
    if (!Array.isArray(notifications)) return;

    for (const notification of notifications) {
      const resourceId = notification.resourceData?.id;
      if (!resourceId) continue;

      try {
        const { data, lastModified } = await pullContact(resourceId);

        await syncService.handleInboundChange('OUTLOOK', resourceId, data, lastModified);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await syncLogService.createLog({
          provider: 'OUTLOOK',
          direction: 'INBOUND',
          status: 'ERROR',
          externalId: resourceId,
          message: 'Failed to process Outlook notification',
          errorDetails: errorMsg,
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await syncLogService.createLog({
      provider: 'OUTLOOK',
      direction: 'INBOUND',
      status: 'ERROR',
      message: 'Webhook processing failed',
      errorDetails: errorMsg,
    });
  }
}

/**
 * Create an Outlook change notification subscription.
 */
export async function setupOutlookSubscription() {
  try {
    const integrationConfig = await prisma.integrationConfig.findUnique({
      where: { provider: 'OUTLOOK' },
    });

    if (!integrationConfig?.enabled) {
      console.log('Outlook subscription: Integration not enabled, skipping');
      return;
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { oauthTokens: { where: { provider: 'OUTLOOK' } } },
    });

    if (!adminUser || adminUser.oauthTokens.length === 0) {
      console.log('Outlook subscription: No admin OAuth token, skipping');
      return;
    }

    // Import dynamically to avoid circular dependency
    const { getAccessToken } = await import('./outlook.auth.js');
    const accessToken = await getAccessToken(adminUser.id);

    const { config } = await import('../../../../config/index.js');

    const expirationDateTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        changeType: 'created,updated,deleted',
        notificationUrl: `${config.baseUrl}/api/webhooks/outlook`,
        resource: '/me/contacts',
        expirationDateTime: expirationDateTime.toISOString(),
        clientState: 'raisehead-erp-outlook-sync',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create Outlook subscription:', error);
      return;
    }

    console.log('Outlook subscription created successfully');
  } catch (error) {
    console.error('Failed to set up Outlook subscription:', error);
  }
}
