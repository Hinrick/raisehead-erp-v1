import type { Request, Response } from 'express';
import * as companyService from './company.service.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.js';
import type { CreateCompanyInput, UpdateCompanyInput } from './company.schema.js';

export async function findAll(req: Request, res: Response) {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '20'), 10);

  const { companies, pagination } = await companyService.findAll(page, limit);
  sendPaginated(res, companies, pagination);
}

export async function findById(req: Request, res: Response) {
  const id = req.params.id as string;
  const company = await companyService.findById(id);
  sendSuccess(res, company);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateCompanyInput;
  const company = await companyService.create(input);
  sendSuccess(res, company, 'Company created successfully', 201);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const input = req.body as UpdateCompanyInput;
  const company = await companyService.update(id, input);
  sendSuccess(res, company, 'Company updated successfully');
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  await companyService.remove(id);
  sendSuccess(res, null, 'Company deleted successfully');
}

export async function search(req: Request, res: Response) {
  const query = String(req.query.q || '');
  if (!query) {
    sendSuccess(res, []);
    return;
  }
  const companies = await companyService.search(query);
  sendSuccess(res, companies);
}
