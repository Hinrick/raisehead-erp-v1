import type { Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400
): Response {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  statusCode = 200
): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
  };
  return res.status(statusCode).json(response);
}
