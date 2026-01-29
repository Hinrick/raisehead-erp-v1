import { Router } from 'express';
import * as companyController from './company.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdSchema,
} from './company.schema.js';

export const companyRoutes = Router();

companyRoutes.use(authenticate);

companyRoutes.get('/', companyController.findAll);
companyRoutes.get('/search', companyController.search);
companyRoutes.get('/:id', validateParams(companyIdSchema), companyController.findById);
companyRoutes.post('/', validate(createCompanySchema), companyController.create);
companyRoutes.put('/:id', validateParams(companyIdSchema), validate(updateCompanySchema), companyController.update);
companyRoutes.delete('/:id', validateParams(companyIdSchema), companyController.remove);
