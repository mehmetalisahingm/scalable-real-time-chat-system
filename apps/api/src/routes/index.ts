import { Router } from 'express';

import { authRoutes } from '@/routes/v1/auth.routes';
import { conversationRoutes } from '@/routes/v1/conversation.routes';
import { healthRoutes } from '@/routes/v1/health.routes';
import { userRoutes } from '@/routes/v1/user.routes';

const router = Router();

router.use('/api/v1/health', healthRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/conversations', conversationRoutes);

export { router };
