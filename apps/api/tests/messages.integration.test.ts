import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  conversationRepositoryMock,
  messageRepositoryMock,
  presenceServiceMock,
  prismaMock,
} from './test-doubles';

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@/repositories/conversation.repository', () => ({
  conversationRepository: conversationRepositoryMock,
}));

vi.mock('@/repositories/message.repository', () => ({
  messageRepository: messageRepositoryMock,
}));

vi.mock('@/services/presence.service', () => ({
  presenceService: presenceServiceMock,
}));

import { createApp } from '@/app/createApp';

describe('message routes', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      username: 'alice',
    });

    conversationRepositoryMock.findByIdForUser.mockResolvedValue({
      id: 'conversation-1',
      participants: [
        {
          userId: 'user-1',
          user: {
            id: 'user-1',
            username: 'alice',
            avatarUrl: 'https://example.com/alice.svg',
            lastSeenAt: null,
          },
        },
        {
          userId: 'user-2',
          user: {
            id: 'user-2',
            username: 'ben',
            avatarUrl: 'https://example.com/ben.svg',
            lastSeenAt: null,
          },
        },
      ],
    });

    messageRepositoryMock.listMessages.mockResolvedValue([
      {
        id: 'message-1',
        clientId: 'client-1',
        conversationId: 'conversation-1',
        senderId: 'user-2',
        content: 'Hello from Ben',
        createdAt: new Date('2026-04-12T10:00:00.000Z'),
        sender: {
          id: 'user-2',
          username: 'ben',
          avatarUrl: 'https://example.com/ben.svg',
          lastSeenAt: null,
        },
      },
    ]);

    presenceServiceMock.getUsersPresence.mockResolvedValue(
      new Map([
        [
          'user-2',
          {
            userId: 'user-2',
            isOnline: true,
            lastSeenAt: new Date('2026-04-12T10:00:00.000Z').toISOString(),
          },
        ],
      ]),
    );
  });

  it('returns paginated message history for an authenticated user', async () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'alice@example.com',
        username: 'alice',
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' },
    );

    const app = createApp();
    const response = await request(app)
      .get('/api/v1/conversations/11111111-1111-1111-1111-111111111111/messages?limit=25')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].content).toBe('Hello from Ben');
    expect(response.body.data.items[0].sender.username).toBe('ben');
  });
});
