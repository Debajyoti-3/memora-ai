import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err.message));

process.on('SIGTERM', async () => {
  await redis.quit();
  process.exit(0);
});

export default redis;