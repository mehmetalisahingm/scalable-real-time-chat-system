export interface ConversationParticipantSummary {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface MessageSummary {
  id: string;
  clientId: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ConversationParticipantSummary;
}

export interface ConversationSummary {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatarUrl: string | null;
  unreadCount: number;
  lastMessage: MessageSummary | null;
  participants: ConversationParticipantSummary[];
}

export interface PresenceEvent {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  username: string;
}

export interface MessageCreatedEvent {
  conversationId: string;
  message: MessageSummary;
}
