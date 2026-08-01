import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function check() {
  if (url && token) {
    const redis = new Redis({ url, token });
    const user = await redis.get('admin_username');
    const pwd = await redis.get('admin_password');
    console.log('User:', user, typeof user);
    console.log('Pwd:', pwd, typeof pwd);
  } else {
    console.log('No redis config');
  }
}
check();
