import type { Request, Response } from 'express';
import { google } from 'googleapis';
import { prisma } from '../../../../config/database.js';
import { config } from '../../../../config/index.js';
import * as syncService from '../../sync/sync.service.js';
import * as syncLogService from '../../sync/sync-log.service.js';
import { getAuthenticatedClient } from './google.auth.js';

/**
 * Handle Google People API push notification.
 * Google sends a POST when contacts change.
 */
export async function handleGoogleWebhook(req: Request, res: Response) {
  // Google expects a 200 response quickly
  res.status(200).send();

  const channelId = req.headers['x-goog-channel-id'] as string;
  const resourceState = req.headers['x-goog-resource-state'] as string;

  if (resourceState === 'sync') {
    // Initial sync notification, ignore
    return;
  }

  try {
    // Fetch changed contacts and process
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { oauthTokens: { where: { provider: 'GOOGLE' } } },
    });

    if (!adminUser || adminUser.oauthTokens.length === 0) {
      return;
    }

    const auth = await getAuthenticatedClient(adminUser.id);
    const service = google.people({ version: 'v1', auth });

    // Get recent connections (delta approach would use syncToken)
    const response = await service.people.connections.list({
      resourceName: 'people/me',
      pageSize: 50,
      personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies,metadata',
      sortOrder: 'LAST_MODIFIED_DESCENDING',
    });

    for (const person of response.data.connections || []) {
      const name = person.names?.[0];
      const lastModified = person.metadata?.sources?.[0]?.updateTime
        ? new Date(person.metadata.sources[0].updateTime)
        : null;

      // Only process recently modified contacts (within last 10 minutes)
      if (lastModified && Date.now() - lastModified.getTime() > 10 * 60 * 1000) {
        continue;
      }

      await syncService.handleInboundChange('GOOGLE', person.resourceName!, {
        displayName: name?.displayName || name?.givenName || 'Unknown',
        firstName: name?.givenName || null,
        lastName: name?.familyName || null,
        email: person.emailAddresses?.[0]?.value || null,
        phone: person.phoneNumbers?.[0]?.value || null,
        address: person.addresses?.[0]?.formattedValue || null,
        jobTitle: person.organizations?.[0]?.title || null,
        notes: person.biographies?.[0]?.value || null,
      }, lastModified);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await syncLogService.createLog({
      provider: 'GOOGLE',
      direction: 'INBOUND',
      status: 'ERROR',
      message: 'Webhook processing failed',
      errorDetails: errorMsg,
    });
  }
}

/**
 * Set up Google People API watch for push notifications.
 */
export async function setupGoogleWatch() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { oauthTokens: { where: { provider: 'GOOGLE' } } },
    });

    if (!adminUser || adminUser.oauthTokens.length === 0) {
      console.log('Google watch: No admin OAuth token, skipping');
      return;
    }

    const integrationConfig = await prisma.integrationConfig.findUnique({
      where: { provider: 'GOOGLE' },
    });

    if (!integrationConfig?.enabled) {
      console.log('Google watch: Integration not enabled, skipping');
      return;
    }

    const auth = await getAuthenticatedClient(adminUser.id);
    const service = google.people({ version: 'v1', auth });

    // Note: People API doesn't have a direct watch endpoint like Calendar API.
    // Contact changes are typically handled via syncToken-based polling or
    // the Contacts API v3 push notifications.
    // For this implementation, we rely on webhook POST notifications
    // configured via Google Cloud Console.

    console.log('Google watch: Webhook endpoint configured at /api/webhooks/google');
  } catch (error) {
    console.error('Failed to set up Google watch:', error);
  }
}
