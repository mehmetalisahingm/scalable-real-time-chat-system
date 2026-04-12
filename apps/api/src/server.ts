import http from 'node:http';

import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';

import { createApp } from '@/app/createApp';
import { env } from '@/config/env';
import { prisma } from '@/lib/prisma';
import { connectRedisClients, disconnectRedisClients, redisPubClient, redisSubClient } from '@/lib/redis';
import { registerSocketHandlers } from '@/sockets/register-socket-handlers';
import { setSocketServer } from '@/sockets/socket-server';

async function bootstrap() {
  await prisma.$connect();
  await connectRedisClients();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.APP_ORIGIN,
      credentials: true,
    },
  });

  io.adapter(createAdapter(redisPubClient, redisSubClient));
  setSocketServer(io);
  registerSocketHandlers(io);

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    await Promise.all([
      prisma.$disconnect(),
      disconnectRedisClients(),
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
    ]);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await disconnectRedisClients();
  process.exit(1);
});
