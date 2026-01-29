import type { Request, Response } from 'express';
import * as mappingService from './notion-mapping.service.js';
import * as syncService from '../../sync/sync.service.js';
import { sendSuccess } from '../../../../shared/utils/response.js';
import type { CreateNotionMappingInput, UpdateNotionMappingInput } from './notion-mapping.schema.js';

export async function findAll(_req: Request, res: Response) {
  const mappings = await mappingService.findAll();
  sendSuccess(res, mappings);
}

export async function findById(req: Request, res: Response) {
  const mapping = await mappingService.findById(req.params.mappingId as string);
  sendSuccess(res, mapping);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateNotionMappingInput;
  const mapping = await mappingService.create(input);
  sendSuccess(res, mapping, 'Notion database mapping created', 201);
}

export async function update(req: Request, res: Response) {
  const input = req.body as UpdateNotionMappingInput;
  const mapping = await mappingService.update(req.params.mappingId as string, input);
  sendSuccess(res, mapping, 'Notion database mapping updated');
}

export async function remove(req: Request, res: Response) {
  await mappingService.remove(req.params.mappingId as string);
  sendSuccess(res, null, 'Notion database mapping deleted');
}

export async function enable(req: Request, res: Response) {
  const mapping = await mappingService.enable(req.params.mappingId as string);
  sendSuccess(res, mapping, 'Notion database mapping enabled');
}

export async function disable(req: Request, res: Response) {
  const mapping = await mappingService.disable(req.params.mappingId as string);
  sendSuccess(res, mapping, 'Notion database mapping disabled');
}

export async function fullSync(req: Request, res: Response) {
  const result = await syncService.fullSyncNotionMapping(req.params.mappingId as string);
  sendSuccess(res, result, 'Full sync completed');
}
