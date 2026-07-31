import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPwd = process.env.ADMIN_PASSWORD || 'admin';

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
