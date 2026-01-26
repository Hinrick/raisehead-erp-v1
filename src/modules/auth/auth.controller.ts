import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

export async function register(req: Request, res: Response) {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);
  sendSuccess(res, result, 'User registered successfully', 201);
}

export async function login(req: Request, res: Response) {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  sendSuccess(res, result, 'Login successful');
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
}
