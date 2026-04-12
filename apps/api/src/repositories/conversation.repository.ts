import { prisma } from '@/lib/prisma';

export const conversationRepository = {
  listUserConversations(userId: string) {
    return prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: true,
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });
  },

  findByIdForUser(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  },

  findDirectConversation(directKey: string) {
    return prisma.conversation.findUnique({
      where: { directKey },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
          },
        },
      },
    });
  },

  createDirectConversation(createdById: string, directKey: string, participantIds: string[]) {
    return prisma.conversation.create({
      data: {
        type: 'DIRECT',
        directKey,
        createdById,
        participants: {
          create: participantIds.map((userId) => ({
            userId,
            role: userId === createdById ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
          },
        },
      },
    });
  },

  createGroupConversation(
    createdById: string,
    name: string,
    participantIds: string[],
    avatarUrl: string | null,
  ) {
    return prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        avatarUrl,
        createdById,
        participants: {
          create: participantIds.map((userId) => ({
            userId,
            role: userId === createdById ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
          },
        },
      },
    });
  },

  listParticipantIds(conversationId: string) {
    return prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
  },

  updateLastReadAt(conversationId: string, userId: string, timestamp: Date) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: timestamp,
      },
    });
  },

  countUnreadMessages(conversationId: string, userId: string, lastReadAt: Date | null) {
    return prisma.message.count({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        ...(lastReadAt
          ? {
              createdAt: {
                gt: lastReadAt,
              },
            }
          : {}),
      },
    });
  },

  touchConversation(conversationId: string, timestamp: Date) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: timestamp,
      },
    });
  },

  listRelatedUserIds(userId: string) {
    return prisma.conversationParticipant.findMany({
      where: {
        conversation: {
          participants: {
            some: { userId },
          },
        },
        userId: {
          not: userId,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });
  },
};
