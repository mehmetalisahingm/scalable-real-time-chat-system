import { Router } from 'express';
import { z } from 'zod';

import {
  createDirectConversationSchema,
  createGroupConversationSchema,
  paginationQuerySchema,
  sendMessageSchema,
} from '@chat/shared';

import { conversationController } from '@/controllers/conversation.controller';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();
const conversationParamsSchema = z.object({
  conversationId: z.string().uuid(),
});
const messageBodySchema = sendMessageSchema.omit({ conversationId: true });

router.use(asyncHandler(requireAuth));
router.get('/', asyncHandler(conversationController.list));
router.post(
  '/direct',
  validate(createDirectConversationSchema),
  asyncHandler(conversationController.createDirect),
);
router.post('/group', validate(createGroupConversationSchema), asyncHandler(conversationController.createGroup));
router.get(
  '/:conversationId/messages',
  validate(conversationParamsSchema, 'params'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(conversationController.listMessages),
);
router.post(
  '/:conversationId/messages',
  validate(conversationParamsSchema, 'params'),
  validate(messageBodySchema),
  asyncHandler(conversationController.createMessage),
);
router.post(
  '/:conversationId/read',
  validate(conversationParamsSchema, 'params'),
  asyncHandler(conversationController.markRead),
);

export { router as conversationRoutes };
