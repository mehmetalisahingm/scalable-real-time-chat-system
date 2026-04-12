import { prisma } from '@/lib/prisma';

export const messageRepository = {
  findByClientId(conversationId: string, senderId: string, clientId: string) {
    return prisma.message.findUnique({
      where: {
        conversationId_senderId_clientId: {
          conversationId,
          senderId,
          clientId,
        },
      },
      include: {
        sender: true,
      },
    });
  },

  createMessage(conversationId: string, senderId: string, clientId: string, content: string) {
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        clientId,
        content,
      },
      include: {
        sender: true,
      },
    });
  },

  listMessages(conversationId: string, cursor: string | undefined, limit: number) {
    return prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor
          ? {
              createdAt: {
                lt: new Date(cursor),
              },
            }
          : {}),
      },
      include: {
        sender: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};
