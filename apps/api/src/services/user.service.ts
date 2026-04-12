import { presenceService } from '@/services/presence.service';
import { userRepository } from '@/repositories/user.repository';

export const userService = {
  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      return null;
    }

    const presence = await presenceService.getUserPresence(user.id, user.lastSeenAt);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isOnline: presence.isOnline,
      lastSeenAt: presence.lastSeenAt,
    };
  },

  async searchUsers(userId: string, query: string) {
    const users = await userRepository.searchUsers(userId, query);
    const presenceMap = await presenceService.getUsersPresence(
      users.map((user) => ({
        id: user.id,
        lastSeenAt: user.lastSeenAt,
      })),
    );

    return users.map((user) => {
      const presence = presenceMap.get(user.id);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isOnline: presence?.isOnline ?? false,
        lastSeenAt: presence?.lastSeenAt ?? user.lastSeenAt?.toISOString() ?? null,
      };
    });
  },
};
