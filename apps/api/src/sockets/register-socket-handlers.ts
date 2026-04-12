import type { Server } from 'socket.io';
import { z } from 'zod';

import { sendMessageSchema, typingEventSchema } from '@chat/shared';

import { SOCKET_EVENTS } from '@/constants/socket-events';
import { conversationService } from '@/services/conversation.service';
import { messageService } from '@/services/message.service';
import { presenceService } from '@/services/presence.service';
import { userRepository } from '@/repositories/user.repository';
import { verifyAccessToken } from '@/utils/jwt';

const joinLeaveSchema = z.object({
  conversationId: z.string().uuid(),
});

export function registerSocketHandlers(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Missing socket token.'));
      }

      const payload = verifyAccessToken(token);
      const user = await userRepository.findById(payload.sub);

      if (!user) {
        return next(new Error('Socket user not found.'));
      }

      socket.data.user = {
        id: user.id,
        username: user.username,
      };

      return next();
    } catch (error) {
      return next(error as Error);
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, username } = socket.data.user;
    socket.join(`user:${userId}`);

    const presence = await presenceService.markOnline(userId);
    const relatedUserIds = await conversationService.listRelatedUserIds(userId);

    relatedUserIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATED, {
        userId,
        isOnline: presence.isOnline,
        lastSeenAt: presence.lastSeenAt,
      });
    });

    socket.emit(SOCKET_EVENTS.CONNECTION_READY, {
      userId,
      username,
    });

    socket.on('conversation:join', async (payload, acknowledge) => {
      try {
        const parsed = joinLeaveSchema.parse(payload);
        await conversationService.assertMembership(userId, parsed.conversationId);
        socket.join(`conversation:${parsed.conversationId}`);
        socket.to(`conversation:${parsed.conversationId}`).emit(SOCKET_EVENTS.ROOM_USER_JOINED, {
          conversationId: parsed.conversationId,
          userId,
          username,
        });
        acknowledge?.({ ok: true });
      } catch (error) {
        acknowledge?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on('conversation:leave', async (payload, acknowledge) => {
      try {
        const parsed = joinLeaveSchema.parse(payload);
        socket.leave(`conversation:${parsed.conversationId}`);
        socket.to(`conversation:${parsed.conversationId}`).emit(SOCKET_EVENTS.ROOM_USER_LEFT, {
          conversationId: parsed.conversationId,
          userId,
          username,
        });
        acknowledge?.({ ok: true });
      } catch (error) {
        acknowledge?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on('typing:start', async (payload) => {
      try {
        const parsed = typingEventSchema.parse(payload);
        await conversationService.assertMembership(userId, parsed.conversationId);
        await presenceService.startTyping(parsed.conversationId, userId);
        socket.to(`conversation:${parsed.conversationId}`).emit(SOCKET_EVENTS.TYPING_STARTED, {
          conversationId: parsed.conversationId,
          userId,
          username,
        });
      } catch (error) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
          message: (error as Error).message,
        });
      }
    });

    socket.on('typing:stop', async (payload) => {
      try {
        const parsed = typingEventSchema.parse(payload);
        await presenceService.stopTyping(parsed.conversationId, userId);
        socket.to(`conversation:${parsed.conversationId}`).emit(SOCKET_EVENTS.TYPING_STOPPED, {
          conversationId: parsed.conversationId,
          userId,
        });
      } catch {
        return;
      }
    });

    socket.on('message:send', async (payload, acknowledge) => {
      try {
        const parsed = sendMessageSchema.parse(payload);
        const result = await messageService.createMessage(userId, parsed);
        acknowledge?.({ ok: true, data: result.message });
      } catch (error) {
        acknowledge?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on('conversation:read', async (payload) => {
      try {
        const parsed = joinLeaveSchema.parse(payload);
        const result = await conversationService.markConversationRead(userId, parsed.conversationId);
        io.to(`user:${userId}`).emit(SOCKET_EVENTS.CONVERSATION_READ, result);
      } catch {
        return;
      }
    });

    socket.on('disconnect', async () => {
      const offlinePresence = await presenceService.markOffline(userId);

      relatedUserIds.forEach((participantId) => {
        io.to(`user:${participantId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATED, {
          userId,
          isOnline: offlinePresence.isOnline,
          lastSeenAt: offlinePresence.lastSeenAt,
        });
      });
    });
  });
}
