import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from '@/config/env';
import { openApiDocument } from '@/config/openapi';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { notFoundMiddleware } from '@/middlewares/not-found.middleware';
import { router } from '@/routes';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use(router);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
