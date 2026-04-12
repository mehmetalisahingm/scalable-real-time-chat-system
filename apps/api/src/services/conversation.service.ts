import { StatusCodes } from 'http-status-codes';

import type {
  ConversationSummary,
  CreateDirectConversationInput,
  CreateGroupConversationInput,
  MessageSummary,
} from '@chat/shared';

import { conversationRepository } from '@/repositories/conversation.repository';
import { userRepository } from '@/repositories/user.repository';
import { presenceService } from '@/services/presence.service';
import { ApiError } from '@/utils/api-error';

function directConversationKey(userA: string, userB: string) {
  return [userA, userB].sort().join(':');
}

function buildGroupAvatar(name: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a,f97316`;
}

export function mapMessageSummary(
  message: {
    id: string;
    clientId: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      username: string;
      avatarUrl: string | null;
      lastSeenAt: Date | null;
    };
  },
  presenceMap: Map<string, { isOnline: boolean; lastSeenAt: string | null }>,
): MessageSummary {
  const senderPresence = presenceMap.get(message.sender.id);

  return {
    id: message.id,
    clientId: message.clientId,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    sender: {
      userId: message.sender.id,
      username: message.sender.username,
      avatarUrl: message.sender.avatarUrl,
      isOnline: senderPresence?.isOnline ?? false,
      lastSeenAt: senderPresence?.lastSeenAt ?? message.sender.lastSeenAt?.toISOString() ?? null,
    },
  };
}

async function mapConversationSummary(
  currentUserId: string,
  participantRecord: Awaited<ReturnType<typeof conversationRepository.listUserConversations>>[number],
): Promise<ConversationSummary> {
  const participants = participantRecord.conversation.participants;
  const presenceMap = await presenceService.getUsersPresence(
    participants.map(({ user }) => ({
      id: user.id,
      lastSeenAt: user.lastSeenAt,
    })),
  );
  const unreadCount = await conversationRepository.countUnreadMessages(
    participantRecord.conversation.id,
    currentUserId,
    participantRecord.lastReadAt,
  );

  const displayParticipants = participants.map(({ user }) => {
    const presence = presenceMap.get(user.id);

    return {
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isOnline: presence?.isOnline ?? false,
      lastSeenAt: presence?.lastSeenAt ?? user.lastSeenAt?.toISOString() ?? null,
    };
  });

  const counterpart = displayParticipants.find((participant) => participant.userId !== currentUserId);
  const lastMessageRecord = participantRecord.conversation.messages[0];

  return {
    id: participantRecord.conversation.id,
    type: participantRecord.conversation.type,
    name:
      participantRecord.conversation.type === 'GROUP'
        ? participantRecord.conversation.name ?? 'Untitled room'
        : counterpart?.username ?? 'Direct message',
    avatarUrl:
      participantRecord.conversation.type === 'GROUP'
        ? participantRecord.conversation.avatarUrl ??
          buildGroupAvatar(participantRecord.conversation.name ?? 'Room')
        : counterpart?.avatarUrl ?? null,
    unreadCount,
    participants: displayParticipants,
    lastMessage: lastMessageRecord ? mapMessageSummary(lastMessageRecord, presenceMap) : null,
  };
}

export const conversationService = {
  async listConversations(currentUserId: string) {
    const records = await conversationRepository.listUserConversations(currentUserId);
    return Promise.all(records.map((record) => mapConversationSummary(currentUserId, record)));
  },

  async createDirectConversation(currentUserId: string, input: CreateDirectConversationInput) {
    if (input.participantId === currentUserId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'You cannot create a direct conversation with yourself.',
        'INVALID_PARTICIPANT',
      );
    }

    const participant = await userRepository.findById(input.participantId);

    if (!participant) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Requested participant does not exist.', 'USER_NOT_FOUND');
    }

    const key = directConversationKey(currentUserId, input.participantId);
    const existingConversation = await conversationRepository.findDirectConversation(key);
    const conversation =
      existingConversation ??
      (await conversationRepository.createDirectConversation(currentUserId, key, [
        currentUserId,
        input.participantId,
      ]));

    const snapshot = await conversationRepository.listUserConversations(currentUserId);
    const target = snapshot.find((record) => record.conversation.id === conversation.id);

    if (!target) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Conversation could not be loaded after creation.');
    }

    return mapConversationSummary(currentUserId, target);
  },

  async createGroupConversation(currentUserId: string, input: CreateGroupConversationInput) {
    const participantIds = Array.from(new Set([currentUserId, ...input.participantIds]));
    const users = await Promise.all(participantIds.map((participantId) => userRepository.findById(participantId)));

    if (users.some((user) => !user)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'One or more group participants are invalid.',
        'INVALID_PARTICIPANTS',
      );
    }

    const conversation = await conversationRepository.createGroupConversation(
      currentUserId,
      input.name,
      participantIds,
      buildGroupAvatar(input.name),
    );
    const snapshot = await conversationRepository.listUserConversations(currentUserId);
    const target = snapshot.find((record) => record.conversation.id === conversation.id);

    if (!target) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Group conversation could not be loaded after creation.');
    }

    return mapConversationSummary(currentUserId, target);
  },

  async assertMembership(currentUserId: string, conversationId: string) {
    const conversation = await conversationRepository.findByIdForUser(conversationId, currentUserId);

    if (!conversation) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Conversation was not found for this user.',
        'CONVERSATION_NOT_FOUND',
      );
    }

    return conversation;
  },

  async markConversationRead(currentUserId: string, conversationId: string) {
    const timestamp = new Date();
    await this.assertMembership(currentUserId, conversationId);
    await conversationRepository.updateLastReadAt(conversationId, currentUserId, timestamp);

    return {
      conversationId,
      readAt: timestamp.toISOString(),
    };
  },

  async listRelatedUserIds(userId: string) {
    const relatedUsers = await conversationRepository.listRelatedUserIds(userId);
    return relatedUsers.map((entry) => entry.userId);
  },
};
