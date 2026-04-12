import { createClient } from 'redis';

import { env } from '@/config/env';

export const redis = createClient({ url: env.REDIS_URL });
export const redisPubClient = createClient({ url: env.REDIS_URL });
export const redisSubClient = createClient({ url: env.REDIS_URL });

export async function connectRedisClients() {
  for (const client of [redis, redisPubClient, redisSubClient]) {
    if (!client.isOpen) {
      await client.connect();
    }
  }
}

export async function disconnectRedisClients() {
  for (const client of [redis, redisPubClient, redisSubClient]) {
    if (client.isOpen) {
      await client.quit();
    }
  }
}
