import { google } from 'googleapis';
import type { Contact, ContactEmail, ContactPhone, ContactAddress } from '@prisma/client';
import { prisma } from '../../../../config/database.js';
import { getAuthenticatedClient } from './google.auth.js';

type ContactWithRelations = Contact & {
  emails?: ContactEmail[];
  phones?: ContactPhone[];
  addresses?: ContactAddress[];
};

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

const PERSON_FIELDS = 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies,nicknames,birthdays,genders,metadata';

function mapLabelToType(label: string): string {
  switch (label) {
    case 'home': return 'home';
    case 'work': return 'work';
    case 'mobile': return 'mobile';
    case 'fax': return 'homeFax';
    default: return 'other';
  }
}

export async function pushContact(
  contact: ContactWithRelations,
  externalId?: string,
): Promise<{ externalId: string; externalData: Record<string, unknown> }> {
  const service = await getPeopleService();

  // Build email addresses from relations or legacy scalar
  const emailAddresses = contact.emails?.length
    ? contact.emails.map((e) => ({ value: e.value, type: mapLabelToType(e.label) }))
    : contact.email ? [{ value: contact.email }] : [];

  // Build phone numbers from relations or legacy scalar
  const phoneNumbers = contact.phones?.length
    ? contact.phones.map((p) => ({ value: p.value, type: mapLabelToType(p.label) }))
    : contact.phone ? [{ value: contact.phone }] : [];

  // Build addresses from relations or legacy scalar
  const addresses = contact.addresses?.length
    ? contact.addresses.map((a) => ({
        formattedValue: a.formattedValue || undefined,
        streetAddress: a.street || undefined,
        city: a.city || undefined,
        region: a.state || undefined,
        postalCode: a.postalCode || undefined,
        country: a.country || undefined,
        countryCode: a.countryCode || undefined,
        type: mapLabelToType(a.label),
      }))
    : contact.address ? [{ formattedValue: contact.address }] : [];

  const personData: Record<string, unknown> = {
    names: [
      {
        givenName: contact.firstName || contact.displayName,
        familyName: contact.lastName || '',
        middleName: contact.middleName || '',
        honorificPrefix: contact.namePrefix || '',
        honorificSuffix: contact.nameSuffix || '',
        displayName: contact.displayName,
      },
    ],
    emailAddresses,
    phoneNumbers,
    addresses,
    organizations: [],
    biographies: contact.notes ? [{ value: contact.notes }] : [],
    nicknames: contact.nickname ? [{ value: contact.nickname }] : [],
    birthdays: contact.birthday
      ? [{ date: { year: contact.birthday.getFullYear(), month: contact.birthday.getMonth() + 1, day: contact.birthday.getDate() } }]
      : [],
    genders: contact.gender ? [{ value: contact.gender }] : [],
  };

  if (externalId) {
    // Get current etag for update
    const existing = await service.people.get({
      resourceName: externalId,
      personFields: 'metadata',
    });

    const result = await service.people.updateContact({
      resourceName: externalId,
      updatePersonFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies,nicknames,birthdays,genders',
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

function mapGoogleTypeToLabel(type?: string): string {
  switch (type) {
    case 'home': return 'home';
    case 'work': return 'work';
    case 'mobile': return 'mobile';
    case 'homeFax':
    case 'workFax': return 'fax';
    default: return 'other';
  }
}

function extractContactData(person: any): Record<string, unknown> {
  const name = person.names?.[0];

  // Extract all emails
  const emails = (person.emailAddresses || []).map((e: any, i: number) => ({
    value: e.value,
    label: mapGoogleTypeToLabel(e.type),
    primary: i === 0,
  }));

  // Extract all phones
  const phones = (person.phoneNumbers || []).map((p: any, i: number) => ({
    value: p.value,
    label: mapGoogleTypeToLabel(p.type),
    primary: i === 0,
  }));

  // Extract all addresses
  const addresses = (person.addresses || []).map((a: any, i: number) => ({
    label: mapGoogleTypeToLabel(a.type),
    primary: i === 0,
    formattedValue: a.formattedValue || null,
    street: a.streetAddress || null,
    city: a.city || null,
    state: a.region || null,
    postalCode: a.postalCode || null,
    country: a.country || null,
    countryCode: a.countryCode || null,
  }));

  // Birthday
  let birthday: string | null = null;
  const bday = person.birthdays?.[0]?.date;
  if (bday && bday.year && bday.month && bday.day) {
    birthday = new Date(bday.year, bday.month - 1, bday.day).toISOString();
  }

  return {
    displayName: name?.displayName || name?.givenName || 'Unknown',
    firstName: name?.givenName || null,
    lastName: name?.familyName || null,
    middleName: name?.middleName || null,
    namePrefix: name?.honorificPrefix || null,
    nameSuffix: name?.honorificSuffix || null,
    nickname: person.nicknames?.[0]?.value || null,
    email: person.emailAddresses?.[0]?.value || null,
    phone: person.phoneNumbers?.[0]?.value || null,
    address: person.addresses?.[0]?.formattedValue || null,
    birthday,
    gender: person.genders?.[0]?.value || null,
    jobTitle: person.organizations?.[0]?.title || null,
    department: person.organizations?.[0]?.department || null,
    notes: person.biographies?.[0]?.value || null,
    emails,
    phones,
    addresses,
  };
}

export async function pullContact(externalId: string): Promise<{
  data: Record<string, unknown>;
  lastModified: Date | null;
}> {
  const service = await getPeopleService();

  const result = await service.people.get({
    resourceName: externalId,
    personFields: PERSON_FIELDS,
  });

  const person = result.data;
  const lastModified = person.metadata?.sources?.[0]?.updateTime
    ? new Date(person.metadata.sources[0].updateTime)
    : null;

  return {
    data: extractContactData(person),
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
      personFields: PERSON_FIELDS,
      pageToken,
    });

    for (const person of response.data.connections || []) {
      const lastModified = person.metadata?.sources?.[0]?.updateTime
        ? new Date(person.metadata.sources[0].updateTime)
        : null;

      results.push({
        externalId: person.resourceName!,
        data: extractContactData(person),
        lastModified,
      });
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return results;
}
