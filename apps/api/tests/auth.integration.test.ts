import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authRepositoryMock,
  presenceServiceMock,
  userRepositoryMock,
} from './test-doubles';

vi.mock('@/repositories/user.repository', () => ({
  userRepository: userRepositoryMock,
}));

vi.mock('@/repositories/auth.repository', () => ({
  authRepository: authRepositoryMock,
}));

vi.mock('@/services/presence.service', () => ({
  presenceService: presenceServiceMock,
}));

import { createApp } from '@/app/createApp';

describe('auth routes', () => {
  beforeEach(() => {
    presenceServiceMock.getUserPresence.mockResolvedValue({
      isOnline: false,
      lastSeenAt: null,
    });
  });

  it('registers a user and issues a refresh cookie', async () => {
    userRepositoryMock.findByEmail.mockResolvedValue(null);
    userRepositoryMock.findByUsername.mockResolvedValue(null);
    userRepositoryMock.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      username: 'new_user',
      avatarUrl: 'https://example.com/avatar.svg',
      lastSeenAt: null,
    });
    userRepositoryMock.findById.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      username: 'new_user',
      avatarUrl: 'https://example.com/avatar.svg',
      lastSeenAt: null,
    });
    authRepositoryMock.createRefreshToken.mockResolvedValue({
      id: 'refresh-1',
    });

    const app = createApp();
    const response = await request(app).post('/api/v1/auth/register').send({
      username: 'new_user',
      email: 'new@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('new@example.com');
    expect(response.body.data.tokens.accessToken).toBeTypeOf('string');
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
  });

  it('logs in an existing user', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 12);

    userRepositoryMock.findByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'alice@example.com',
      username: 'alice',
      passwordHash,
      avatarUrl: 'https://example.com/alice.svg',
      lastSeenAt: null,
    });
    userRepositoryMock.findById.mockResolvedValue({
      id: 'user-2',
      email: 'alice@example.com',
      username: 'alice',
      avatarUrl: 'https://example.com/alice.svg',
      lastSeenAt: null,
    });
    authRepositoryMock.createRefreshToken.mockResolvedValue({
      id: 'refresh-2',
    });

    const app = createApp();
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.username).toBe('alice');
    expect(response.body.data.tokens.accessToken).toBeTypeOf('string');
  });
});
