import crypto from 'node:crypto';

import { StatusCodes } from 'http-status-codes';

import type { AuthResponse, LoginInput, RegisterInput } from '@chat/shared';

import { env } from '@/config/env';
import { authRepository } from '@/repositories/auth.repository';
import { userRepository } from '@/repositories/user.repository';
import { presenceService } from '@/services/presence.service';
import { ApiError } from '@/utils/api-error';
import { getRefreshCookieOptions } from '@/utils/cookie';
import { addDays } from '@/utils/date';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { hashPassword, verifyPassword } from '@/utils/password';

function buildAvatarUrl(username: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=f97316,0f172a`;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function buildAuthResponse(userId: string): Promise<AuthResponse> {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authenticated user could not be loaded.');
  }

  const presence = await presenceService.getUserPresence(user.id, user.lastSeenAt);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isOnline: presence.isOnline,
      lastSeenAt: presence.lastSeenAt,
    },
    tokens: {
      accessToken: signAccessToken(user),
    },
  };
}

async function createRefreshToken(userId: string) {
  const refreshToken = signRefreshToken({ sub: userId });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS);

  await authRepository.createRefreshToken(userId, tokenHash, expiresAt);

  return refreshToken;
}

export const authService = {
  async register(input: RegisterInput) {
    const [existingEmail, existingUsername] = await Promise.all([
      userRepository.findByEmail(input.email),
      userRepository.findByUsername(input.username),
    ]);

    if (existingEmail) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered.', 'EMAIL_TAKEN');
    }

    if (existingUsername) {
      throw new ApiError(StatusCodes.CONFLICT, 'Username is already taken.', 'USERNAME_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.createUser(
      input.email,
      input.username,
      passwordHash,
      buildAvatarUrl(input.username),
    );

    const [response, refreshToken] = await Promise.all([
      buildAuthResponse(user.id),
      createRefreshToken(user.id),
    ]);

    return {
      response,
      refreshToken,
      cookieOptions: getRefreshCookieOptions(),
    };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);

    if (!passwordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const [response, refreshToken] = await Promise.all([
      buildAuthResponse(user.id),
      createRefreshToken(user.id),
    ]);

    return {
      response,
      refreshToken,
      cookieOptions: getRefreshCookieOptions(),
    };
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is missing.', 'MISSING_REFRESH_TOKEN');
    }

    verifyRefreshToken(refreshToken);

    const tokenHash = hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token is invalid or expired.',
        'INVALID_REFRESH_TOKEN',
      );
    }

    await authRepository.revokeRefreshToken(tokenHash);

    const [response, rotatedRefreshToken] = await Promise.all([
      buildAuthResponse(storedToken.userId),
      createRefreshToken(storedToken.userId),
    ]);

    return {
      response,
      refreshToken: rotatedRefreshToken,
      cookieOptions: getRefreshCookieOptions(),
    };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return { cookieOptions: getRefreshCookieOptions() };
    }

    await authRepository.revokeRefreshToken(hashToken(refreshToken));

    return { cookieOptions: getRefreshCookieOptions() };
  },
};
