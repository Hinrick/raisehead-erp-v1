import { google } from 'googleapis';
import type { Contact } from '@prisma/client';
import { prisma } from '../../../../config/database.js';
import { getAuthenticatedClient } from './google.auth.js';

async function getPeopleService() {
  // Use the first admin user's token for service-level operations
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    include: { oauthTokens: { where: { provider: 'GOOGLE' } } },
  });

  if (!adminUser || adminUser.oauthTokens.length === 0) {
    throw new Error('No Google OAuth token found. Admin must connect Google account first.');
  }

  const auth = await getAuthenticatedClient(adminUser.id);
  return google.people({ version: 'v1', auth });
}

export async function pushContact(
  contact: Contact,
  externalId?: string,
): Promise<{ externalId: string; externalData: Record<string, unknown> }> {
  const service = await getPeopleService();

  const personData: Record<string, unknown> = {
    names: [
      {
        givenName: contact.firstName || contact.displayName,
        familyName: contact.lastName || '',
        displayName: contact.displayName,
      },
    ],
    emailAddresses: contact.email ? [{ value: contact.email }] : [],
    phoneNumbers: contact.phone ? [{ value: contact.phone }] : [],
    addresses: contact.address ? [{ formattedValue: contact.address }] : [],
    organizations: [],
    biographies: contact.notes ? [{ value: contact.notes }] : [],
  };

  if (externalId) {
    // Get current etag for update
    const existing = await service.people.get({
      resourceName: externalId,
      personFields: 'metadata',
    });

    const result = await service.people.updateContact({
      resourceName: externalId,
      updatePersonFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies',
      requestBody: {
        etag: existing.data.etag!,
        ...personData,
      },
    });

    return {
      externalId: result.data.resourceName!,
      externalData: result.data as unknown as Record<string, unknown>,
    };
  }

  // Create new contact
  const result = await service.people.createContact({
    requestBody: personData as any,
  });

  return {
    externalId: result.data.resourceName!,
    externalData: result.data as unknown as Record<string, unknown>,
  };
}

export async function pullContact(externalId: string): Promise<{
  data: Record<string, unknown>;
  lastModified: Date | null;
}> {
  const service = await getPeopleService();

  const result = await service.people.get({
    resourceName: externalId,
    personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies,metadata',
  });

  const person = result.data;
  const name = person.names?.[0];
  const email = person.emailAddresses?.[0]?.value;
  const phone = person.phoneNumbers?.[0]?.value;
  const address = person.addresses?.[0]?.formattedValue;
  const lastModified = person.metadata?.sources?.[0]?.updateTime
    ? new Date(person.metadata.sources[0].updateTime)
    : null;

  return {
    data: {
      displayName: name?.displayName || name?.givenName || 'Unknown',
      firstName: name?.givenName || null,
      lastName: name?.familyName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      jobTitle: person.organizations?.[0]?.title || null,
      notes: person.biographies?.[0]?.value || null,
    },
    lastModified,
  };
}

export async function deleteContact(externalId: string): Promise<void> {
  const service = await getPeopleService();
  await service.people.deleteContact({ resourceName: externalId });
}

export async function fetchAllContacts(): Promise<
  Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }>
> {
  const service = await getPeopleService();
  const results: Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }> = [];

  let pageToken: string | undefined;

  do {
    const response = await service.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies,metadata',
      pageToken,
    });

    for (const person of response.data.connections || []) {
      const name = person.names?.[0];
      const lastModified = person.metadata?.sources?.[0]?.updateTime
        ? new Date(person.metadata.sources[0].updateTime)
        : null;

      results.push({
        externalId: person.resourceName!,
        data: {
          displayName: name?.displayName || name?.givenName || 'Unknown',
          firstName: name?.givenName || null,
          lastName: name?.familyName || null,
          email: person.emailAddresses?.[0]?.value || null,
          phone: person.phoneNumbers?.[0]?.value || null,
          address: person.addresses?.[0]?.formattedValue || null,
          jobTitle: person.organizations?.[0]?.title || null,
          notes: person.biographies?.[0]?.value || null,
        },
        lastModified,
      });
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return results;
}
