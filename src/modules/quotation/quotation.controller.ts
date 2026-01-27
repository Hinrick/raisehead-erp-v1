import type { Request, Response } from 'express';
import * as quotationService from './quotation.service.js';
import { generateQuotationPdf } from './pdf/quotation-pdf.generator.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';
import type { CreateQuotationInput, UpdateQuotationInput } from './quotation.schema.js';

export async function findAll(req: Request, res: Response) {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '20'), 10);
  const status = req.query.status ? String(req.query.status) : undefined;

  const { quotations, pagination } = await quotationService.findAll(page, limit, status);
  sendPaginated(res, quotations, pagination);
}

export async function findById(req: Request, res: Response) {
  const id = req.params.id as string;
  const quotation = await quotationService.findById(id);
  sendSuccess(res, quotation);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = req.body as CreateQuotationInput;
  const quotation = await quotationService.create(input, req.user!.id);
  sendSuccess(res, quotation, 'Quotation created successfully', 201);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const input = req.body as UpdateQuotationInput;
  const quotation = await quotationService.update(id, input);
  sendSuccess(res, quotation, 'Quotation updated successfully');
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  await quotationService.remove(id);
  sendSuccess(res, null, 'Quotation deleted successfully');
}

export async function markAsSent(req: Request, res: Response) {
  const id = req.params.id as string;
  const quotation = await quotationService.updateStatus(id, 'SENT');
  sendSuccess(res, quotation, 'Quotation marked as sent');
}

export async function generatePdf(req: Request, res: Response) {
  const id = req.params.id as string;
  const quotation = await quotationService.findById(id);

  const pdfBuffer = await generateQuotationPdf(quotation);

  const filename = `quotation-${quotation.quotationNumber.replace('#', '')}-${quotation.contact.displayName}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
}

export async function getNextNumber(_req: Request, res: Response) {
  const nextNumber = await quotationService.getNextQuotationNumber();
  sendSuccess(res, { nextNumber });
}
