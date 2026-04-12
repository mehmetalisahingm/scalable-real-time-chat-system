import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { userController } from '@/controllers/user.controller';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();

router.use(asyncHandler(requireAuth));
router.get('/me', asyncHandler(userController.me));
router.get('/', asyncHandler(userController.search));

export { router as userRoutes };
