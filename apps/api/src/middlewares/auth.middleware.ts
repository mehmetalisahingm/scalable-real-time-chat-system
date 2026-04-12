import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '@/lib/prisma';
import { ApiError } from '@/utils/api-error';
import { verifyAccessToken } from '@/utils/jwt';

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Missing or invalid access token.'));
  }

  const token = authorization.replace('Bearer ', '');
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authenticated user no longer exists.'));
  }

  request.user = {
    id: user.id,
    email: user.email,
    username: user.username,
  };

  return next();
}
