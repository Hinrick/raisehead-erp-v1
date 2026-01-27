import { google } from 'googleapis';
import { prisma } from '../../../../config/database.js';
import { config } from '../../../../config/index.js';
import { encrypt, decrypt } from '../../encryption.js';

const SCOPES = ['https://www.googleapis.com/auth/contacts'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    `${config.baseUrl}/api/oauth/google/callback`,
  );
}

export function getGoogleAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(userId: string, code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  await prisma.oAuthToken.upsert({
    where: { userId_provider: { userId, provider: 'GOOGLE' } },
    create: {
      userId,
      provider: 'GOOGLE',
      accessToken: encrypt(tokens.access_token!),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || SCOPES.join(' '),
    },
    update: {
      accessToken: encrypt(tokens.access_token!),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || SCOPES.join(' '),
    },
  });
}

export async function getAuthenticatedClient(userId: string) {
  const token = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: 'GOOGLE' } },
  });

  if (!token) {
    throw new Error('Google account not connected');
  }

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: decrypt(token.accessToken),
    refresh_token: token.refreshToken ? decrypt(token.refreshToken) : undefined,
    expiry_date: token.expiresAt?.getTime(),
  });

  // Handle token refresh
  client.on('tokens', async (newTokens) => {
    await prisma.oAuthToken.update({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      data: {
        accessToken: encrypt(newTokens.access_token!),
        ...(newTokens.refresh_token && { refreshToken: encrypt(newTokens.refresh_token) }),
        expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
      },
    });
  });

  return client;
}
