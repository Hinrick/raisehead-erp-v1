import { Router } from 'express';
import { authenticate, requireRole } from '../../../auth/auth.middleware.js';
import { validate } from '../../../../shared/middleware/validate.js';
import { validateParams } from '../../../../shared/middleware/validate.js';
import { createNotionMappingSchema, updateNotionMappingSchema, mappingIdSchema } from './notion-mapping.schema.js';
import * as mappingController from './notion-mapping.controller.js';

export const notionMappingRoutes = Router();

notionMappingRoutes.use(authenticate);
notionMappingRoutes.use(requireRole('ADMIN'));

notionMappingRoutes.get('/', mappingController.findAll);
notionMappingRoutes.post('/', validate(createNotionMappingSchema), mappingController.create);

notionMappingRoutes.get('/:mappingId', validateParams(mappingIdSchema), mappingController.findById);
notionMappingRoutes.put('/:mappingId', validateParams(mappingIdSchema), validate(updateNotionMappingSchema), mappingController.update);
notionMappingRoutes.delete('/:mappingId', validateParams(mappingIdSchema), mappingController.remove);

notionMappingRoutes.post('/:mappingId/enable', validateParams(mappingIdSchema), mappingController.enable);
notionMappingRoutes.post('/:mappingId/disable', validateParams(mappingIdSchema), mappingController.disable);
notionMappingRoutes.post('/:mappingId/sync', validateParams(mappingIdSchema), mappingController.fullSync);
