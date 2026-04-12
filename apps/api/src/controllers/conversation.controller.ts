import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { conversationService } from '@/services/conversation.service';
import { messageService } from '@/services/message.service';

export const conversationController = {
  async list(request: Request, response: Response) {
    const conversations = await conversationService.listConversations(request.user.id);

    return response.status(StatusCodes.OK).json({
      data: conversations,
    });
  },

  async createDirect(request: Request, response: Response) {
    const conversation = await conversationService.createDirectConversation(request.user.id, request.body);

    return response.status(StatusCodes.OK).json({
      data: conversation,
    });
  },

  async createGroup(request: Request, response: Response) {
    const conversation = await conversationService.createGroupConversation(request.user.id, request.body);

    return response.status(StatusCodes.CREATED).json({
      data: conversation,
    });
  },

  async listMessages(request: Request, response: Response) {
    const result = await messageService.listMessages(
      request.user.id,
      request.params.conversationId,
      typeof request.query.cursor === 'string' ? request.query.cursor : undefined,
      Number(request.query.limit),
    );

    return response.status(StatusCodes.OK).json({
      data: result,
    });
  },

  async createMessage(request: Request, response: Response) {
    const input = {
      ...request.body,
      conversationId: request.params.conversationId,
    };
    const message = await messageService.createMessageFromHttp(request.user.id, input);

    return response.status(StatusCodes.CREATED).json({
      data: message,
    });
  },

  async markRead(request: Request, response: Response) {
    const result = await conversationService.markConversationRead(
      request.user.id,
      request.params.conversationId,
    );

    return response.status(StatusCodes.OK).json({
      data: result,
    });
  },
};
