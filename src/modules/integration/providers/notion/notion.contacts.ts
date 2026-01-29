import { Client as NotionClient } from '@notionhq/client';
import type { Contact, ContactEmail, ContactPhone, ContactCompany, Company } from '@prisma/client';

type ContactCompanyWithCompany = ContactCompany & { company: Company };

type ContactWithRelations = Contact & {
  emails?: ContactEmail[];
  phones?: ContactPhone[];
  companies?: ContactCompanyWithCompany[];
};
import { prisma } from '../../../../config/database.js';

async function getNotionConfig(): Promise<{ apiKey: string }> {
  const integrationConfig = await prisma.integrationConfig.findUnique({
    where: { provider: 'NOTION' },
  });

  if (!integrationConfig?.enabled) {
    throw new Error('Notion integration is not enabled');
  }

  const notionConfig = integrationConfig.config as { apiKey?: string; databaseId?: string };

  if (!notionConfig.apiKey) {
    throw new Error('Notion API key not configured');
  }

  return { apiKey: notionConfig.apiKey };
}

async function getNotionClient(): Promise<NotionClient> {
  const { apiKey } = await getNotionConfig();
  return new NotionClient({ auth: apiKey });
}

/**
 * The property schema we expect on every Notion contact database.
 * "title" is skipped because every DB already has exactly one title column.
 */
const REQUIRED_PROPERTIES: Record<string, Record<string, unknown>> = {
  Email: { email: {} },
  Phone: { phone_number: {} },
  Address: { rich_text: {} },
  'Job Title': { rich_text: {} },
  'Tax ID': { rich_text: {} },
  'First Name': { rich_text: {} },
  'Last Name': { rich_text: {} },
  'Middle Name': { rich_text: {} },
  'Name Prefix': { rich_text: {} },
  'Name Suffix': { rich_text: {} },
  Nickname: { rich_text: {} },
  Birthday: { date: {} },
  Gender: { rich_text: {} },
  Department: { rich_text: {} },
  Notes: { rich_text: {} },
  Company: { rich_text: {} },
};

/**
 * Ensure the Notion database has all the properties we need.
 * Missing properties are created; existing ones with the correct type are left untouched.
 * Uses native fetch with the 2022-06-28 API version (same workaround as fetchAllContacts).
 */
export async function ensureDatabaseProperties(databaseId: string): Promise<{ created: string[]; existing: string[] }> {
  const { apiKey } = await getNotionConfig();

  // 1. Retrieve current database schema
  const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
    },
  });

  if (!dbRes.ok) {
    const errorBody = await dbRes.text();
    throw new Error(`Notion API error ${dbRes.status} retrieving database: ${errorBody}`);
  }

  const dbData: any = await dbRes.json();
  const existingProps: Record<string, any> = dbData.properties || {};

  // 2. Figure out which properties are missing
  const created: string[] = [];
  const existing: string[] = [];
  const propsToCreate: Record<string, Record<string, unknown>> = {};

  for (const [name, schema] of Object.entries(REQUIRED_PROPERTIES)) {
    if (existingProps[name]) {
      existing.push(name);
    } else {
      propsToCreate[name] = schema;
      created.push(name);
    }
  }

  if (created.length === 0) {
    return { created, existing };
  }

  // 3. Update database to add missing properties
  const updateRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: propsToCreate }),
  });

  if (!updateRes.ok) {
    const errorBody = await updateRes.text();
    throw new Error(`Notion API error ${updateRes.status} updating database properties: ${errorBody}`);
  }

  return { created, existing };
}

export async function pushContact(
  contact: ContactWithRelations,
  externalId?: string,
  databaseId?: string,
): Promise<{ externalId: string; externalData: Record<string, unknown> }> {
  const notion = await getNotionClient();

  // Use primary email/phone from relations if available, fall back to legacy scalar
  const primaryEmail = contact.emails?.find((e) => e.primary)?.value ?? contact.emails?.[0]?.value ?? contact.email;
  const primaryPhone = contact.phones?.find((p) => p.primary)?.value ?? contact.phones?.[0]?.value ?? contact.phone;

  // Derive job title, department, company name from first company association
  const firstCompany = contact.companies?.[0];
  const jobTitle = firstCompany?.jobTitle || null;
  const department = firstCompany?.department || null;
  const companyName = firstCompany?.company?.name || null;

  const richText = (val: string | null) =>
    val ? { rich_text: [{ text: { content: val } }] } : { rich_text: [] };

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: contact.displayName } }] },
    Email: primaryEmail ? { email: primaryEmail } : { email: null },
    Phone: primaryPhone ? { phone_number: primaryPhone } : { phone_number: null },
    Address: richText(contact.address),
    'Job Title': richText(jobTitle),
    'Tax ID': richText(contact.taxId),
    'First Name': richText(contact.firstName),
    'Last Name': richText(contact.lastName),
    'Middle Name': richText(contact.middleName),
    'Name Prefix': richText(contact.namePrefix),
    'Name Suffix': richText(contact.nameSuffix),
    Nickname: richText(contact.nickname),
    Birthday: contact.birthday
      ? { date: { start: contact.birthday.toISOString().split('T')[0] } }
      : { date: null },
    Gender: richText(contact.gender),
    Department: richText(department),
    Notes: richText(contact.notes),
    Company: richText(companyName),
  };

  if (externalId) {
    const result = await notion.pages.update({
      page_id: externalId,
      properties: properties as any,
    });

    return {
      externalId: result.id,
      externalData: result as unknown as Record<string, unknown>,
    };
  }

  if (!databaseId) {
    throw new Error('Notion database ID is required to create a new contact');
  }

  const result = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: properties as any,
  });

  return {
    externalId: result.id,
    externalData: result as unknown as Record<string, unknown>,
  };
}

export async function pullContact(externalId: string): Promise<{
  data: Record<string, unknown>;
  lastModified: Date | null;
}> {
  const notion = await getNotionClient();

  const page = await notion.pages.retrieve({ page_id: externalId }) as any;
  const props = page.properties || {};

  const getName = (prop: any): string => {
    if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
    return 'Unknown';
  };

  const getRichText = (prop: any): string | null => {
    if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
    return null;
  };

  return {
    data: {
      displayName: getName(props.Name),
      email: props.Email?.email || null,
      phone: props.Phone?.phone_number || null,
      address: getRichText(props.Address),
      jobTitle: getRichText(props['Job Title']),
      taxId: getRichText(props['Tax ID']),
      firstName: getRichText(props['First Name']),
      lastName: getRichText(props['Last Name']),
      middleName: getRichText(props['Middle Name']),
      namePrefix: getRichText(props['Name Prefix']),
      nameSuffix: getRichText(props['Name Suffix']),
      nickname: getRichText(props.Nickname),
      birthday: props.Birthday?.date?.start || null,
      gender: getRichText(props.Gender),
      department: getRichText(props.Department),
      notes: getRichText(props.Notes),
      company: getRichText(props.Company),
    },
    lastModified: page.last_edited_time ? new Date(page.last_edited_time) : null,
  };
}

export async function deleteContact(externalId: string): Promise<void> {
  const notion = await getNotionClient();
  await notion.pages.update({
    page_id: externalId,
    archived: true,
  });
}

export async function fetchAllContacts(databaseId: string): Promise<
  Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }>
> {
  const { apiKey } = await getNotionConfig();
  const results: Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }> = [];

  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    // Use native fetch with older Notion API version because the SDK v5.8.0
    // always overwrites the Notion-Version header with 2025-09-03, which
    // removed the databases/{id}/query endpoint.
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Notion API error ${res.status}: ${errorBody}`);
    }

    const response: any = await res.json();

    for (const page of response.results) {
      const p = page as any;
      const props = p.properties || {};

      const getName = (prop: any): string => {
        if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
        return 'Unknown';
      };

      const getRichText = (prop: any): string | null => {
        if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
        return null;
      };

      results.push({
        externalId: p.id,
        data: {
          displayName: getName(props.Name),
          email: props.Email?.email ?? null,
          phone: props.Phone?.phone_number ?? null,
          address: getRichText(props.Address),
          jobTitle: getRichText(props['Job Title']),
          taxId: getRichText(props['Tax ID']),
          firstName: getRichText(props['First Name']),
          lastName: getRichText(props['Last Name']),
          middleName: getRichText(props['Middle Name']),
          namePrefix: getRichText(props['Name Prefix']),
          nameSuffix: getRichText(props['Name Suffix']),
          nickname: getRichText(props.Nickname),
          birthday: props.Birthday?.date?.start || null,
          gender: getRichText(props.Gender),
          department: getRichText(props.Department),
          notes: getRichText(props.Notes),
          company: getRichText(props.Company),
        },
        lastModified: p.last_edited_time ? new Date(p.last_edited_time) : null,
      });
    }

    cursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (cursor);

  return results;
}
