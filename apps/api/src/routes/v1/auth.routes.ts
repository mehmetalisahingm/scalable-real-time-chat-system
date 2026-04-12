import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { loginSchema, refreshSchema, registerSchema } from '@chat/shared';

import { authController } from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many authentication attempts. Please try again shortly.',
      code: 'RATE_LIMITED',
    },
  },
});

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));

export { router as authRoutes };
