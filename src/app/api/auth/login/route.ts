import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    let validUser = 'admin';
    let validPwd = 'admin';

    if (redis) {
      const dbUser = await redis.get('admin_username');
      const dbPwd = await redis.get('admin_password');
      if (dbUser !== null && dbUser !== undefined) validUser = String(dbUser);
      if (dbPwd !== null && dbPwd !== undefined) validPwd = String(dbPwd);
    }

    if (username === validUser && password === validPwd) {
      const response = NextResponse.json({ success: true });
      
      // Set an HTTP-Only cookie for authentication
      response.cookies.set({
        name: 'admin_token',
        value: 'authenticated', // In a real app, this should be a signed JWT
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Bad request' },
      { status: 400 }
    );
  }
}
