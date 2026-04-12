import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type RequestTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: RequestTarget = 'body') {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request[target]);
    request[target] = parsed;
    next();
  };
}
