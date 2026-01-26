import type { Request, Response } from 'express';
import * as clientService from './client.service.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.js';
import type { CreateClientInput, UpdateClientInput } from './client.schema.js';

export async function findAll(req: Request, res: Response) {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '20'), 10);

  const { clients, pagination } = await clientService.findAll(page, limit);
  sendPaginated(res, clients, pagination);
}

export async function findById(req: Request, res: Response) {
  const id = req.params.id as string;
  const client = await clientService.findById(id);
  sendSuccess(res, client);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateClientInput;
  const client = await clientService.create(input);
  sendSuccess(res, client, 'Client created successfully', 201);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const input = req.body as UpdateClientInput;
  const client = await clientService.update(id, input);
  sendSuccess(res, client, 'Client updated successfully');
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  await clientService.remove(id);
  sendSuccess(res, null, 'Client deleted successfully');
}

export async function search(req: Request, res: Response) {
  const query = String(req.query.q || '');
  if (!query) {
    sendSuccess(res, []);
    return;
  }
  const clients = await clientService.search(query);
  sendSuccess(res, clients);
}
