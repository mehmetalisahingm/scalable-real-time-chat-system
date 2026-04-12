import { z } from 'zod';

import {
  DEFAULT_MESSAGE_PAGE_SIZE,
  MAX_MESSAGE_LENGTH,
  MAX_ROOM_NAME_LENGTH,
} from '../constants/chat';

export const conversationTypeSchema = z.enum(['DIRECT', 'GROUP']);

export const createDirectConversationSchema = z.object({
  participantId: z.string().uuid(),
});

export const createGroupConversationSchema = z.object({
  name: z.string().min(2).max(MAX_ROOM_NAME_LENGTH),
  participantIds: z.array(z.string().uuid()).min(1),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  clientId: z.string().min(6).max(64),
});

export const paginationQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(DEFAULT_MESSAGE_PAGE_SIZE),
});

export const typingEventSchema = z.object({
  conversationId: z.string().uuid(),
});

export const markReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export type CreateDirectConversationInput = z.infer<typeof createDirectConversationSchema>;
export type CreateGroupConversationInput = z.infer<typeof createGroupConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
