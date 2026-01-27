import { Router } from 'express';
import * as tagController from './tag.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import { createTagSchema, updateTagSchema, tagIdSchema } from './tag.schema.js';

export const tagRoutes = Router();

tagRoutes.use(authenticate);

tagRoutes.get('/', tagController.findAll);
tagRoutes.post('/', validate(createTagSchema), tagController.create);
tagRoutes.put('/:id', validateParams(tagIdSchema), validate(updateTagSchema), tagController.update);
tagRoutes.delete('/:id', validateParams(tagIdSchema), tagController.remove);
