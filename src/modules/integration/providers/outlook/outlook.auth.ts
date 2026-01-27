import { prisma } from '../../../../config/database.js';
import { config } from '../../../../config/index.js';
import { encrypt, decrypt } from '../../encryption.js';

const SCOPES = ['Contacts.ReadWrite', 'offline_access'];

export function getOutlookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: config.outlook.clientId,
    response_type: 'code',
    redirect_uri: `${config.baseUrl}/api/oauth/outlook/callback`,
    scope: SCOPES.join(' '),
    response_mode: 'query',
    prompt: 'consent',
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

export async function handleOutlookCallback(userId: string, code: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.outlook.clientId,
      client_secret: config.outlook.clientSecret,
      code,
      redirect_uri: `${config.baseUrl}/api/oauth/outlook/callback`,
      grant_type: 'authorization_code',
      scope: SCOPES.join(' '),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outlook token exchange failed: ${error}`);
  }

  const tokens = await response.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  await prisma.oAuthToken.upsert({
    where: { userId_provider: { userId, provider: 'OUTLOOK' } },
    create: {
      userId,
      provider: 'OUTLOOK',
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    },
  });
}

export async function getAccessToken(userId: string): Promise<string> {
  const token = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: 'OUTLOOK' } },
  });

  if (!token) {
    throw new Error('Outlook account not connected');
  }

  // Refresh if expired
  if (token.expiresAt && token.expiresAt < new Date() && token.refreshToken) {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.outlook.clientId,
        client_secret: config.outlook.clientSecret,
        refresh_token: decrypt(token.refreshToken),
        grant_type: 'refresh_token',
        scope: SCOPES.join(' '),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Outlook token');
    }

    const newTokens = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    await prisma.oAuthToken.update({
      where: { userId_provider: { userId, provider: 'OUTLOOK' } },
      data: {
        accessToken: encrypt(newTokens.access_token),
        ...(newTokens.refresh_token && { refreshToken: encrypt(newTokens.refresh_token) }),
        expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
      },
    });

    return newTokens.access_token;
  }

  return decrypt(token.accessToken);
}
