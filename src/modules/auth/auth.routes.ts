import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
import { validate } from '../../shared/middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.get('/me', authenticate, authController.me);
