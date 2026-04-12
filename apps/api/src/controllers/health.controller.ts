import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const healthController = {
  async check(_request: Request, response: Response) {
    await prisma.$queryRaw`SELECT 1`;

    return response.status(StatusCodes.OK).json({
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: 'up',
          redis: redis.isOpen ? 'up' : 'down',
        },
      },
    });
  },
};
