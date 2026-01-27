import { Router } from 'express';
import * as integrationController from './integration.controller.js';
import { authenticate, requireRole } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import { providerParamSchema, upsertIntegrationSchema } from './integration.schema.js';

export const integrationRoutes = Router();

integrationRoutes.use(authenticate);
integrationRoutes.use(requireRole('ADMIN'));

integrationRoutes.get('/', integrationController.findAll);
integrationRoutes.get('/:provider', validateParams(providerParamSchema), integrationController.findByProvider);
integrationRoutes.put('/:provider', validateParams(providerParamSchema), validate(upsertIntegrationSchema), integrationController.upsert);
integrationRoutes.post('/:provider/enable', validateParams(providerParamSchema), integrationController.enable);
integrationRoutes.post('/:provider/disable', validateParams(providerParamSchema), integrationController.disable);
