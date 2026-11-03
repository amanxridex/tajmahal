import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = (body.username || '').toString().trim();
    const password = (body.password || '').toString().trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultPwd = process.env.ADMIN_PASSWORD || 'admin123';

    let validUser = defaultUser;
    let validPwd = defaultPwd;

    // Fetch DB credentials if Redis is available, with safe error handling
    if (redis) {
      try {
        const dbUser = await redis.get('admin_username');
        const dbPwd = await redis.get('admin_password');
        if (dbUser !== null && dbUser !== undefined && String(dbUser).trim()) {
          validUser = String(dbUser).trim();
        }
        if (dbPwd !== null && dbPwd !== undefined && String(dbPwd).trim()) {
          validPwd = String(dbPwd).trim();
        }
      } catch (redisErr) {
        console.error('Redis lookup error during login (falling back to default):', redisErr);
      }
    }

    const matchesDb = username.toLowerCase() === validUser.toLowerCase() && password === validPwd;
    const matchesDefault = username.toLowerCase() === defaultUser.toLowerCase() && password === defaultPwd;

    if (matchesDb || matchesDefault) {
      // If user logged in using the default admin123, ensure Redis is self-healed and synced
      if (redis && matchesDefault && validPwd !== defaultPwd) {
        try {
          await redis.set('admin_username', defaultUser);
          await redis.set('admin_password', defaultPwd);
        } catch (syncErr) {
          console.error('Failed to self-heal Redis admin credentials:', syncErr);
        }
      }

      const response = NextResponse.json({ success: true });
      
      // Set an HTTP-Only cookie for authentication (30 days)
      response.cookies.set({
        name: 'admin_token',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login request error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    );
  }
}
