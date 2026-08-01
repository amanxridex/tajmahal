import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export async function GET() {
  if (redis) {
    await redis.set('admin_username', 'admin');
    await redis.set('admin_password', 'admin');
    return NextResponse.json({ success: true, message: 'Password has been fully reset to: admin / admin' });
  }
  return NextResponse.json({ success: false, message: 'Database not connected' });
}
