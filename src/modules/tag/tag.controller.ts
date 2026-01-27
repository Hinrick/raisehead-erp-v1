import type { Request, Response } from 'express';
import * as tagService from './tag.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import type { CreateTagInput, UpdateTagInput } from './tag.schema.js';

export async function findAll(_req: Request, res: Response) {
  const tags = await tagService.findAll();
  sendSuccess(res, tags);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateTagInput;
  const tag = await tagService.create(input);
  sendSuccess(res, tag, 'Tag created successfully', 201);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const input = req.body as UpdateTagInput;
  const tag = await tagService.update(id, input);
  sendSuccess(res, tag, 'Tag updated successfully');
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  await tagService.remove(id);
  sendSuccess(res, null, 'Tag deleted successfully');
}
