import { redis } from '@/lib/redis';
import { userRepository } from '@/repositories/user.repository';

const userConnectionsKey = (userId: string) => `presence:user:${userId}:connections`;
const userLastSeenKey = (userId: string) => `presence:user:${userId}:last-seen`;
const typingKey = (conversationId: string, userId: string) => `typing:${conversationId}:${userId}`;

export const presenceService = {
  async markOnline(userId: string) {
    const now = new Date().toISOString();
    await Promise.all([redis.incr(userConnectionsKey(userId)), redis.set(userLastSeenKey(userId), now)]);

    return {
      isOnline: true,
      lastSeenAt: now,
    };
  },

  async markOffline(userId: string) {
    const current = await redis.decr(userConnectionsKey(userId));
    const now = new Date();

    if (current <= 0) {
      await Promise.all([
        redis.del(userConnectionsKey(userId)),
        redis.set(userLastSeenKey(userId), now.toISOString()),
        userRepository.updateLastSeen(userId, now),
      ]);
    }

    return {
      isOnline: current > 0,
      lastSeenAt: now.toISOString(),
    };
  },

  async getUserPresence(userId: string, persistedLastSeenAt?: Date | null) {
    const [connectionCount, redisLastSeen] = await Promise.all([
      redis.get(userConnectionsKey(userId)),
      redis.get(userLastSeenKey(userId)),
    ]);

    return {
      isOnline: Number(connectionCount ?? 0) > 0,
      lastSeenAt: redisLastSeen ?? persistedLastSeenAt?.toISOString() ?? null,
    };
  },

  async getUsersPresence(
    users: Array<{
      id: string;
      lastSeenAt?: Date | null;
    }>,
  ) {
    const states = await Promise.all(
      users.map(async (user) => ({
        userId: user.id,
        ...(await this.getUserPresence(user.id, user.lastSeenAt)),
      })),
    );

    return new Map(states.map((state) => [state.userId, state]));
  },

  async startTyping(conversationId: string, userId: string) {
    await redis.set(typingKey(conversationId, userId), '1', {
      EX: 5,
    });
  },

  async stopTyping(conversationId: string, userId: string) {
    await redis.del(typingKey(conversationId, userId));
  },
};
