import type { SendMessageInput } from '@chat/shared';

import { SOCKET_EVENTS } from '@/constants/socket-events';
import { conversationRepository } from '@/repositories/conversation.repository';
import { messageRepository } from '@/repositories/message.repository';
import { conversationService, mapMessageSummary } from '@/services/conversation.service';
import { presenceService } from '@/services/presence.service';
import { getSocketServer } from '@/sockets/socket-server';

export const messageService = {
  async listMessages(currentUserId: string, conversationId: string, cursor: string | undefined, limit: number) {
    await conversationService.assertMembership(currentUserId, conversationId);

    const messages = await messageRepository.listMessages(conversationId, cursor, limit);
    const senderPresence = await presenceService.getUsersPresence(
      messages.map((message) => ({
        id: message.sender.id,
        lastSeenAt: message.sender.lastSeenAt,
      })),
    );
    const items = messages.map((message) => mapMessageSummary(message, senderPresence)).reverse();
    const oldest = messages[messages.length - 1];

    return {
      items,
      nextCursor: oldest ? oldest.createdAt.toISOString() : null,
    };
  },

  async createMessage(currentUserId: string, input: SendMessageInput) {
    const conversation = await conversationService.assertMembership(currentUserId, input.conversationId);

    const existingMessage = await messageRepository.findByClientId(
      input.conversationId,
      currentUserId,
      input.clientId,
    );

    if (existingMessage) {
      const presenceMap = await presenceService.getUsersPresence([
        { id: existingMessage.sender.id, lastSeenAt: existingMessage.sender.lastSeenAt },
      ]);

      return {
        message: mapMessageSummary(existingMessage, presenceMap),
        participantIds: conversation.participants.map((participant) => participant.userId),
      };
    }

    const createdAt = new Date();
    const message = await messageRepository.createMessage(
      input.conversationId,
      currentUserId,
      input.clientId,
      input.content,
    );

    await Promise.all([
      conversationRepository.touchConversation(input.conversationId, createdAt),
      conversationRepository.updateLastReadAt(input.conversationId, currentUserId, createdAt),
      presenceService.stopTyping(input.conversationId, currentUserId),
    ]);

    const presenceMap = await presenceService.getUsersPresence([
      { id: message.sender.id, lastSeenAt: message.sender.lastSeenAt },
    ]);
    const payload = mapMessageSummary(message, presenceMap);
    const participantIds = conversation.participants.map((participant) => participant.userId);
    const io = getSocketServer();

    participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit(SOCKET_EVENTS.MESSAGE_CREATED, {
        conversationId: input.conversationId,
        message: payload,
      });
    });

    io.to(`conversation:${input.conversationId}`).emit(SOCKET_EVENTS.TYPING_STOPPED, {
      conversationId: input.conversationId,
      userId: currentUserId,
    });

    return {
      message: payload,
      participantIds,
    };
  },

  async createMessageFromHttp(currentUserId: string, input: SendMessageInput) {
    const result = await this.createMessage(currentUserId, input);
    return result.message;
  },
};
