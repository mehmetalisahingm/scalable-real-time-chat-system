import { Router } from 'express';

import { healthController } from '@/controllers/health.controller';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();

router.get('/', asyncHandler(healthController.check));

export { router as healthRoutes };
