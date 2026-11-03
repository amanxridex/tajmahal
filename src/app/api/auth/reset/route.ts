import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

async function executeReset() {
  const defaultUser = process.env.ADMIN_USERNAME || 'admin';
  const defaultPwd = process.env.ADMIN_PASSWORD || 'admin123';

  if (redis) {
    try {
      await redis.set('admin_username', defaultUser);
      await redis.set('admin_password', defaultPwd);
      return {
        success: true,
        message: `Credentials in Redis database have been successfully reset to: ${defaultUser} / ${defaultPwd}`
      };
    } catch (err) {
      console.error('Failed to reset Redis DB:', err);
      return {
        success: false,
        error: 'Failed to write to Redis database'
      };
    }
  }

  return {
    success: true,
    message: `Database not connected. Default credentials in code are: ${defaultUser} / ${defaultPwd}`
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const confirm = searchParams.get('confirm');

  // Prevent automated web crawlers or indexing bots from triggering unintended credential resets
  if (confirm !== 'true' && confirm !== 'yes' && confirm !== '1') {
    return NextResponse.json({
      success: false,
      notice: 'To prevent web crawlers from resetting credentials, please add ?confirm=true to this URL (e.g. /api/auth/reset?confirm=true) or send a POST request.',
      default_credentials: 'admin / admin123'
    });
  }

  const result = await executeReset();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await executeReset();
  return NextResponse.json(result);
}
