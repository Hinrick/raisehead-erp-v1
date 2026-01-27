import { Router } from 'express';
import * as contactController from './contact.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import {
  createContactSchema,
  updateContactSchema,
  contactIdSchema,
  contactTagsSchema,
} from './contact.schema.js';

export const contactRoutes = Router();

contactRoutes.use(authenticate);

contactRoutes.get('/', contactController.findAll);
contactRoutes.get('/search', contactController.search);
contactRoutes.get('/:id', validateParams(contactIdSchema), contactController.findById);
contactRoutes.post('/', validate(createContactSchema), contactController.create);
contactRoutes.put('/:id', validateParams(contactIdSchema), validate(updateContactSchema), contactController.update);
contactRoutes.delete('/:id', validateParams(contactIdSchema), contactController.remove);
contactRoutes.post('/:id/tags', validateParams(contactIdSchema), validate(contactTagsSchema), contactController.addTags);
contactRoutes.delete('/:id/tags/:tagId', contactController.removeTag);
contactRoutes.get('/:id/members', validateParams(contactIdSchema), contactController.getMembers);
