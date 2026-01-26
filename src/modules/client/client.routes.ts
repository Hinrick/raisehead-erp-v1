import { Router } from 'express';
import * as clientController from './client.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import { createClientSchema, updateClientSchema, clientIdSchema } from './client.schema.js';

export const clientRoutes = Router();

// All routes require authentication
clientRoutes.use(authenticate);

clientRoutes.get('/', clientController.findAll);
clientRoutes.get('/search', clientController.search);
clientRoutes.get('/:id', validateParams(clientIdSchema), clientController.findById);
clientRoutes.post('/', validate(createClientSchema), clientController.create);
clientRoutes.put('/:id', validateParams(clientIdSchema), validate(updateClientSchema), clientController.update);
clientRoutes.delete('/:id', validateParams(clientIdSchema), clientController.remove);
