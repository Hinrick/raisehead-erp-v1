import { Client } from '@microsoft/microsoft-graph-client';
import type { Contact, ContactEmail, ContactPhone, ContactAddress } from '@prisma/client';
import { prisma } from '../../../../config/database.js';
import { getAccessToken } from './outlook.auth.js';

type ContactWithRelations = Contact & {
  emails?: ContactEmail[];
  phones?: ContactPhone[];
  addresses?: ContactAddress[];
};

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

const SELECT_FIELDS = 'id,displayName,givenName,surname,middleName,nickName,title,generation,emailAddresses,businessPhones,homePhones,mobilePhone,businessAddress,homeAddress,otherAddress,jobTitle,department,personalNotes,birthday,lastModifiedDateTime';

function buildOutlookAddress(addr: ContactAddress): Record<string, string> {
  return {
    street: addr.street || addr.formattedValue || '',
    city: addr.city || '',
    state: addr.state || '',
    postalCode: addr.postalCode || '',
    countryOrRegion: addr.country || '',
  };
}

export async function pushContact(
  contact: ContactWithRelations,
  externalId?: string,
): Promise<{ externalId: string; externalData: Record<string, unknown> }> {
  const client = await getGraphClient();

  // Build email addresses from relations or legacy scalar
  const emailAddresses = contact.emails?.length
    ? contact.emails.map((e) => ({ address: e.value, name: contact.displayName }))
    : contact.email
      ? [{ address: contact.email, name: contact.displayName }]
      : [];

  // Build phones from relations or legacy scalar
  const businessPhones: string[] = [];
  const homePhones: string[] = [];
  let mobilePhone: string | undefined;

  if (contact.phones?.length) {
    for (const p of contact.phones) {
      if (p.label === 'mobile') mobilePhone = p.value;
      else if (p.label === 'home') homePhones.push(p.value);
      else businessPhones.push(p.value);
    }
  } else if (contact.phone) {
    businessPhones.push(contact.phone);
  }

  // Build addresses from relations or legacy scalar
  let businessAddress: Record<string, string> | undefined;
  let homeAddress: Record<string, string> | undefined;
  let otherAddress: Record<string, string> | undefined;

  if (contact.addresses?.length) {
    for (const a of contact.addresses) {
      const addr = buildOutlookAddress(a);
      if (a.label === 'home') homeAddress = addr;
      else if (a.label === 'other') otherAddress = addr;
      else businessAddress = addr;
    }
  } else if (contact.address) {
    businessAddress = { street: contact.address };
  }

  const contactData: Record<string, unknown> = {
    givenName: contact.firstName || contact.displayName,
    surname: contact.lastName || '',
    middleName: contact.middleName || undefined,
    nickName: contact.nickname || undefined,
    title: contact.namePrefix || undefined,
    generation: contact.nameSuffix || undefined,
    displayName: contact.displayName,
    emailAddresses,
    businessPhones,
    homePhones,
    mobilePhone: mobilePhone || undefined,
    businessAddress,
    homeAddress,
    otherAddress,
    jobTitle: undefined,
    personalNotes: contact.notes || undefined,
    birthday: contact.birthday ? contact.birthday.toISOString() : undefined,
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

function extractContactData(result: any): Record<string, unknown> {
  // Merge all emails
  const emails = (result.emailAddresses || []).map((e: any, i: number) => ({
    value: e.address,
    label: 'work',
    primary: i === 0,
  }));

  // Merge all phones
  const phones: Array<{ value: string; label: string; primary: boolean }> = [];
  let firstPhone = true;
  for (const p of result.businessPhones || []) {
    phones.push({ value: p, label: 'work', primary: firstPhone });
    firstPhone = false;
  }
  for (const p of result.homePhones || []) {
    phones.push({ value: p, label: 'home', primary: firstPhone });
    firstPhone = false;
  }
  if (result.mobilePhone) {
    phones.push({ value: result.mobilePhone, label: 'mobile', primary: firstPhone });
    firstPhone = false;
  }

  // Merge all addresses
  const addresses: Array<Record<string, unknown>> = [];
  let firstAddr = true;
  const addrSources: Array<{ data: any; label: string }> = [
    { data: result.businessAddress, label: 'work' },
    { data: result.homeAddress, label: 'home' },
    { data: result.otherAddress, label: 'other' },
  ];
  for (const src of addrSources) {
    if (src.data && (src.data.street || src.data.city || src.data.state || src.data.postalCode || src.data.countryOrRegion)) {
      addresses.push({
        label: src.label,
        primary: firstAddr,
        formattedValue: [src.data.street, src.data.city, src.data.state, src.data.postalCode, src.data.countryOrRegion].filter(Boolean).join(', '),
        street: src.data.street || null,
        city: src.data.city || null,
        state: src.data.state || null,
        postalCode: src.data.postalCode || null,
        country: src.data.countryOrRegion || null,
        countryCode: null,
      });
      firstAddr = false;
    }
  }

  return {
    displayName: result.displayName || 'Unknown',
    firstName: result.givenName || null,
    lastName: result.surname || null,
    middleName: result.middleName || null,
    namePrefix: result.title || null,
    nameSuffix: result.generation || null,
    nickname: result.nickName || null,
    email: result.emailAddresses?.[0]?.address || null,
    phone: result.businessPhones?.[0] || null,
    address: result.businessAddress?.street || null,
    jobTitle: result.jobTitle || null,
    department: result.department || null,
    notes: result.personalNotes || null,
    birthday: result.birthday ? new Date(result.birthday).toISOString() : null,
    emails,
    phones,
    addresses,
  };
}

export async function pullContact(externalId: string): Promise<{
  data: Record<string, unknown>;
  lastModified: Date | null;
}> {
  const client = await getGraphClient();

  const result = await client
    .api(`/me/contacts/${externalId}`)
    .select(SELECT_FIELDS)
    .get();

  return {
    data: extractContactData(result),
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
    .select(SELECT_FIELDS)
    .top(100)
    .get();

  while (response) {
    for (const contact of response.value || []) {
      results.push({
        externalId: contact.id,
        data: extractContactData(contact),
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
