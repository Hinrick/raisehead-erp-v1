import type { Response } from 'express';
import { prisma } from '../../../config/database.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthenticatedRequest } from '../../../shared/types/index.js';
import type { SyncProvider } from '@prisma/client';
import { getGoogleAuthUrl, handleGoogleCallback } from '../providers/google/google.auth.js';
import { getOutlookAuthUrl, handleOutlookCallback } from '../providers/outlook/outlook.auth.js';

export async function googleAuthorize(_req: AuthenticatedRequest, res: Response) {
  const url = getGoogleAuthUrl();
  sendSuccess(res, { url });
}

export async function googleCallback(req: AuthenticatedRequest, res: Response) {
  const code = req.query.code as string;
  if (!code) {
    throw new AppError('Authorization code is required', 400);
  }

  await handleGoogleCallback(req.user!.id, code);
  sendSuccess(res, null, 'Google account connected successfully');
}

export async function outlookAuthorize(_req: AuthenticatedRequest, res: Response) {
  const url = getOutlookAuthUrl();
  sendSuccess(res, { url });
}

export async function outlookCallback(req: AuthenticatedRequest, res: Response) {
  const code = req.query.code as string;
  if (!code) {
    throw new AppError('Authorization code is required', 400);
  }

  await handleOutlookCallback(req.user!.id, code);
  sendSuccess(res, null, 'Outlook account connected successfully');
}

export async function disconnect(req: AuthenticatedRequest, res: Response) {
  const provider = req.params.provider as SyncProvider;

  await prisma.oAuthToken.deleteMany({
    where: {
      userId: req.user!.id,
      provider,
    },
  });

  sendSuccess(res, null, `${provider} disconnected successfully`);
}

export async function status(req: AuthenticatedRequest, res: Response) {
  const tokens = await prisma.oAuthToken.findMany({
    where: { userId: req.user!.id },
    select: {
      provider: true,
      expiresAt: true,
      scope: true,
      createdAt: true,
    },
  });

  const statusMap: Record<string, { connected: boolean; expiresAt?: Date | null; scope?: string | null }> = {
    GOOGLE: { connected: false },
    OUTLOOK: { connected: false },
    NOTION: { connected: false },
  };

  for (const token of tokens) {
    statusMap[token.provider] = {
      connected: true,
      expiresAt: token.expiresAt,
      scope: token.scope,
    };
  }

  sendSuccess(res, statusMap);
}
