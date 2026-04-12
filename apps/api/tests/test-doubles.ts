import { vi } from 'vitest';

export const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

export const userRepositoryMock = {
  createUser: vi.fn(),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  findById: vi.fn(),
  searchUsers: vi.fn(),
  updateLastSeen: vi.fn(),
};

export const authRepositoryMock = {
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
};

export const conversationRepositoryMock = {
  listUserConversations: vi.fn(),
  findByIdForUser: vi.fn(),
  findDirectConversation: vi.fn(),
  createDirectConversation: vi.fn(),
  createGroupConversation: vi.fn(),
  listParticipantIds: vi.fn(),
  updateLastReadAt: vi.fn(),
  countUnreadMessages: vi.fn(),
  touchConversation: vi.fn(),
  listRelatedUserIds: vi.fn(),
};

export const messageRepositoryMock = {
  findByClientId: vi.fn(),
  createMessage: vi.fn(),
  listMessages: vi.fn(),
};

export const presenceServiceMock = {
  markOnline: vi.fn(),
  markOffline: vi.fn(),
  getUserPresence: vi.fn(),
  getUsersPresence: vi.fn(),
  startTyping: vi.fn(),
  stopTyping: vi.fn(),
};
