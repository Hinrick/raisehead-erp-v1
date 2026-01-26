import type { Request } from 'express';
import type { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
