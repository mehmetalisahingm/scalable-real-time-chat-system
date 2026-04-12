import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '@/config/env';
import { ApiError } from '@/utils/api-error';

interface JwtPayload {
  sub: string;
}

function verifyToken(token: string, secret: string): JwtPayload {
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;

    if (!payload.sub) {
      throw new Error('Token subject is missing.');
    }

    return payload;
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token is invalid or expired.', 'TOKEN_INVALID');
  }
}

export function signAccessToken(user: { id: string; email: string; username: string }) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL },
  );
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyAccessToken(token: string) {
  return verifyToken(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
}
