import { prisma } from '@/lib/prisma';

export const userRepository = {
  createUser(email: string, username: string, passwordHash: string, avatarUrl: string | null) {
    return prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        avatarUrl,
      },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  searchUsers(excludeUserId: string, query: string) {
    return prisma.user.findMany({
      where: {
        id: {
          not: excludeUserId,
        },
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: {
        username: 'asc',
      },
      take: 10,
    });
  },

  updateLastSeen(userId: string, timestamp: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastSeenAt: timestamp,
      },
    });
  },
};
