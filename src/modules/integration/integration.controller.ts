import type { Request, Response } from 'express';
import * as integrationService from './integration.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import type { SyncProvider } from '@prisma/client';
import type { UpsertIntegrationInput } from './integration.schema.js';

export async function findAll(_req: Request, res: Response) {
  const configs = await integrationService.findAll();
  sendSuccess(res, configs);
}

export async function findByProvider(req: Request, res: Response) {
  const provider = req.params.provider as SyncProvider;
  const config = await integrationService.findByProvider(provider);
  sendSuccess(res, config);
}

export async function upsert(req: Request, res: Response) {
  const provider = req.params.provider as SyncProvider;
  const input = req.body as UpsertIntegrationInput;
  const config = await integrationService.upsert(provider, input);
  sendSuccess(res, config, 'Integration config updated');
}

export async function enable(req: Request, res: Response) {
  const provider = req.params.provider as SyncProvider;
  const config = await integrationService.enable(provider);
  sendSuccess(res, config, `${provider} integration enabled`);
}

export async function disable(req: Request, res: Response) {
  const provider = req.params.provider as SyncProvider;
  const config = await integrationService.disable(provider);
  sendSuccess(res, config, `${provider} integration disabled`);
}
