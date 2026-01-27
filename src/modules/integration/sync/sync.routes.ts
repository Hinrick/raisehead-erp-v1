import { Router } from 'express';
import * as syncController from './sync.controller.js';
import { authenticate, requireRole } from '../../auth/auth.middleware.js';
import { validateParams } from '../../../shared/middleware/validate.js';
import { syncProviderParamSchema, syncContactParamSchema } from './sync.schema.js';

export const syncRoutes = Router();

syncRoutes.use(authenticate);

syncRoutes.post(
  '/:provider/full',
  requireRole('ADMIN'),
  validateParams(syncProviderParamSchema),
  syncController.fullSync,
);

syncRoutes.post(
  '/:provider/contact/:contactId',
  validateParams(syncContactParamSchema),
  syncController.syncSingleContact,
);

syncRoutes.get('/logs', syncController.getLogs);
