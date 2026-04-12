import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function notFoundMiddleware(request: Request, response: Response) {
  return response.status(StatusCodes.NOT_FOUND).json({
    error: {
      message: `Route ${request.method} ${request.originalUrl} was not found.`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}
