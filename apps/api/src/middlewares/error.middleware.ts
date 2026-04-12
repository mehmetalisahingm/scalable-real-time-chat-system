import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { ApiError } from '@/utils/api-error';

export function errorMiddleware(
  error: Error,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  void next;

  if (error instanceof ZodError) {
    return response.status(StatusCodes.BAD_REQUEST).json({
      error: {
        message: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        details: error.flatten(),
      },
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    });
  }

  console.error(error);

  return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: {
      message: 'Unexpected server error.',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
