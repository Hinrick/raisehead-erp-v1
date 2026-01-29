import { Client as NotionClient } from '@notionhq/client';
import type { Contact } from '@prisma/client';
import { prisma } from '../../../../config/database.js';

async function getNotionClient(): Promise<NotionClient> {
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

  return new NotionClient({ auth: notionConfig.apiKey });
}

export async function pushContact(
  contact: Contact,
  externalId?: string,
  databaseId?: string,
): Promise<{ externalId: string; externalData: Record<string, unknown> }> {
  const notion = await getNotionClient();

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: contact.displayName } }] },
    Email: contact.email ? { email: contact.email } : { email: null },
    Phone: contact.phone ? { phone_number: contact.phone } : { phone_number: null },
  };

  if (contact.address) {
    properties['Address'] = { rich_text: [{ text: { content: contact.address } }] };
  }

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
  const notion = await getNotionClient();
  const results: Array<{ externalId: string; data: Record<string, unknown>; lastModified: Date | null }> = [];

  let cursor: string | undefined;

  do {
    const response: any = await notion.request({
      path: `databases/${databaseId}/query`,
      method: 'post',
      body: {
        start_cursor: cursor,
        page_size: 100,
      },
    });

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
          email: props.Email?.email || null,
          phone: props.Phone?.phone_number || null,
          address: getRichText(props.Address),
          jobTitle: getRichText(props['Job Title']),
          taxId: getRichText(props['Tax ID']),
        },
        lastModified: p.last_edited_time ? new Date(p.last_edited_time) : null,
      });
    }

    cursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (cursor);

  return results;
}
