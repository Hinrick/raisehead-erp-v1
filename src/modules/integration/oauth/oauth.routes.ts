import { Router } from 'express';
import * as oauthController from './oauth.controller.js';
import { authenticate } from '../../auth/auth.middleware.js';

export const oauthRoutes = Router();

oauthRoutes.use(authenticate);

oauthRoutes.get('/google/authorize', oauthController.googleAuthorize);
oauthRoutes.get('/google/callback', oauthController.googleCallback);
oauthRoutes.get('/outlook/authorize', oauthController.outlookAuthorize);
oauthRoutes.get('/outlook/callback', oauthController.outlookCallback);
oauthRoutes.delete('/:provider/disconnect', oauthController.disconnect);
oauthRoutes.get('/status', oauthController.status);
