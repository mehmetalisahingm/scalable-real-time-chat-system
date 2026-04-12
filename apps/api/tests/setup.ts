import { afterEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/chat_app?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-at-least-thirty-two-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-thirty-two-characters';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.COOKIE_DOMAIN = '';
process.env.COOKIE_SECURE = 'false';

afterEach(() => {
  vi.clearAllMocks();
});
