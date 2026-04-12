import type { CookieOptions, Response } from 'express';

import { env } from '@/config/env';

export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function clearRefreshCookie(response: Response, options: CookieOptions) {
  response.clearCookie('refreshToken', {
    ...options,
    maxAge: undefined,
  });
}
