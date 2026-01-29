import path from 'path';
import type { Request, Response } from 'express';
import * as contactService from './contact.service.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.js';
import type { CreateContactInput, UpdateContactInput } from './contact.schema.js';

export async function findAll(req: Request, res: Response) {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '20'), 10);
  const tagId = req.query.tagId as string | undefined;

  const { contacts, pagination } = await contactService.findAll(page, limit, tagId);
  sendPaginated(res, contacts, pagination);
}

export async function findById(req: Request, res: Response) {
  const id = req.params.id as string;
  const contact = await contactService.findById(id);
  sendSuccess(res, contact);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateContactInput;
  const contact = await contactService.create(input);
  sendSuccess(res, contact, 'Contact created successfully', 201);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const input = req.body as UpdateContactInput;
  const contact = await contactService.update(id, input);
  sendSuccess(res, contact, 'Contact updated successfully');
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  await contactService.remove(id);
  sendSuccess(res, null, 'Contact deleted successfully');
}

export async function search(req: Request, res: Response) {
  const query = String(req.query.q || '');
  if (!query) {
    sendSuccess(res, []);
    return;
  }
  const contacts = await contactService.search(query);
  sendSuccess(res, contacts);
}

export async function addTags(req: Request, res: Response) {
  const id = req.params.id as string;
  const { tagIds } = req.body as { tagIds: string[] };
  const contact = await contactService.addTags(id, tagIds);
  sendSuccess(res, contact, 'Tags added successfully');
}

export async function removeTag(req: Request, res: Response) {
  const id = req.params.id as string;
  const tagId = req.params.tagId as string;
  const contact = await contactService.removeTag(id, tagId);
  sendSuccess(res, contact, 'Tag removed successfully');
}

export async function addCompany(req: Request, res: Response) {
  const id = req.params.id as string;
  const { companyId, jobTitle, department } = req.body as { companyId: string; jobTitle?: string; department?: string };
  const contact = await contactService.addCompany(id, companyId, jobTitle, department);
  sendSuccess(res, contact, 'Company association added successfully');
}

export async function removeCompany(req: Request, res: Response) {
  const id = req.params.id as string;
  const companyId = req.params.companyId as string;
  const contact = await contactService.removeCompany(id, companyId);
  sendSuccess(res, contact, 'Company association removed successfully');
}

export async function uploadNameCard(req: Request, res: Response) {
  const id = req.params.id as string;
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  const relativePath = `uploads/namecards/${req.file.filename}`;
  const contact = await contactService.updateNameCard(id, relativePath);
  sendSuccess(res, contact, 'Name card uploaded successfully');
}

export async function serveNameCard(req: Request, res: Response) {
  const id = req.params.id as string;
  const contact = await contactService.findById(id);
  if (!contact.nameCardPath) {
    res.status(404).json({ success: false, error: 'No name card image found' });
    return;
  }
  const absolute = path.resolve(contact.nameCardPath);
  res.sendFile(absolute);
}

export async function deleteNameCard(req: Request, res: Response) {
  const id = req.params.id as string;
  await contactService.removeNameCard(id);
  sendSuccess(res, null, 'Name card deleted successfully');
}
