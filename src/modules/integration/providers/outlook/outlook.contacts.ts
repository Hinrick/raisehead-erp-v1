import { Client } from '@microsoft/microsoft-graph-client';
import type { Contact } from '@prisma/client';
import { prisma } from '../../../../config/database.js';
import { getAccessToken } from './outlook.auth.js';

async function getGraphClient(): Promise<Client> {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    include: { oauthTokens: { where: { provider: 'OUTLOOK' } } },
  });

  if (!adminUser || adminUser.oauthTokens.length === 0) {
    throw new Error('No Outlook OAuth token found. Admin must connect Outlook account first.');
  }

  const accessToken = await getAccessToken(adminUser.id);

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

export async function pushContact(
  contact: Contact,
  externalId?: string,
): Promise<{ externalId: string; externalData: Record<string, unknown> }> {
  const client = await getGraphClient();

  const contactData = {
    givenName: contact.firstName || contact.displayName,
    surname: contact.lastName || '',
    displayName: contact.displayName,
    emailAddresses: contact.email
      ? [{ address: contact.email, name: contact.displayName }]
      : [],
    businessPhones: contact.phone ? [contact.phone] : [],
    businessAddress: contact.address
      ? { street: contact.address }
      : undefined,
    jobTitle: contact.jobTitle || undefined,
    personalNotes: contact.notes || undefined,
  };

  if (externalId) {
    const result = await client.api(`/me/contacts/${externalId}`).patch(contactData);
    return {
      externalId: result.id,
      externalData: result,
    };
  }

  const result = await client.api('/me/contacts').post(contactData);
  return {
    externalId: result.id,
    externalData: result,
  };
}

export async function pullContact(externalId: string): Promise<{
  data: Record<string, unknown>;
  lastModified: Date | null;
}> {
  const client = await getGraphClient();

  const result = await client
    .api(`/me/contacts/${externalId}`)
    .select('displayName,givenName,surname,emailAddresses,businessPhones,businessAddress,jobTitle,personalNotes,lastModifiedDateTime')
    .get();

  return {
    data: {
      displayName: result.displayName || 'Unknown',
      firstName: result.givenName || null,
      lastName: result.surname || null,
      email: result.emailAddresses?.[0]?.address || null,
      phone: result.businessPhones?.[0] || null,
      address: result.businessAddress?.street || null,
      jobTitle: result.jobTitle || null,
      notes: result.personalNotes || null,
    },
    lastModified: result.lastModifiedDateTime
      ? new Date(result.lastModifiedDateTime)
      : null,
  };
}

export async function deleteContact(externalId: string): Promise<void> {
  const client = await getGraphClient();
  await client.api(`/me/contacts/${externalId}`).delete();
}

export async function fetchAllContacts(): Promise<
  Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }>
> {
  const client = await getGraphClient();
  const results: Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }> = [];

  let response = await client
    .api('/me/contacts')
    .select('id,displayName,givenName,surname,emailAddresses,businessPhones,businessAddress,jobTitle,personalNotes,lastModifiedDateTime')
    .top(100)
    .get();

  while (response) {
    for (const contact of response.value || []) {
      results.push({
        externalId: contact.id,
        data: {
          displayName: contact.displayName || 'Unknown',
          firstName: contact.givenName || null,
          lastName: contact.surname || null,
          email: contact.emailAddresses?.[0]?.address || null,
          phone: contact.businessPhones?.[0] || null,
          address: contact.businessAddress?.street || null,
          jobTitle: contact.jobTitle || null,
          notes: contact.personalNotes || null,
        },
        lastModified: contact.lastModifiedDateTime
          ? new Date(contact.lastModifiedDateTime)
          : null,
      });
    }

    if (response['@odata.nextLink']) {
      response = await client.api(response['@odata.nextLink']).get();
    } else {
      break;
    }
  }

  return results;
}
