import type { Request, Response } from 'express';
import * as syncService from './sync.service.js';
import * as syncLogService from './sync-log.service.js';
import { sendSuccess, sendPaginated } from '../../../shared/utils/response.js';
import type { SyncProvider } from '@prisma/client';

export async function fullSync(req: Request, res: Response) {
  const provider = req.params.provider as SyncProvider;
  const result = await syncService.fullSync(provider);
  sendSuccess(res, result, `Full sync completed for ${provider}`);
}

export async function syncSingleContact(req: Request, res: Response) {
  const provider = req.params.provider as SyncProvider;
  const contactId = req.params.contactId as string;
  const result = await syncService.syncSingleContact(provider, contactId);
  sendSuccess(res, result, 'Contact synced successfully');
}

export async function getLogs(req: Request, res: Response) {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '50'), 10);
  const provider = req.query.provider as SyncProvider | undefined;

  const { logs, pagination } = await syncLogService.findAll(page, limit, provider);
  sendPaginated(res, logs, pagination);
}
