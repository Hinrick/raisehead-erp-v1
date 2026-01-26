import { Router } from 'express';
import * as quotationController from './quotation.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import { createQuotationSchema, updateQuotationSchema, quotationIdSchema } from './quotation.schema.js';

export const quotationRoutes = Router();

// All routes require authentication
quotationRoutes.use(authenticate);

quotationRoutes.get('/', quotationController.findAll);
quotationRoutes.get('/next-number', quotationController.getNextNumber);
quotationRoutes.get('/:id', validateParams(quotationIdSchema), quotationController.findById);
quotationRoutes.get('/:id/pdf', validateParams(quotationIdSchema), quotationController.generatePdf);
quotationRoutes.post('/', validate(createQuotationSchema), quotationController.create);
quotationRoutes.post('/:id/send', validateParams(quotationIdSchema), quotationController.markAsSent);
quotationRoutes.put('/:id', validateParams(quotationIdSchema), validate(updateQuotationSchema), quotationController.update);
quotationRoutes.delete('/:id', validateParams(quotationIdSchema), quotationController.remove);
