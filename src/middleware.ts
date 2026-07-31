import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // We want to protect the /admin page AND  // Check if it's the admin UI or the write API (POST, PUT, DELETE)
  const isProtectedUI = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');
  const isProtectedAPI = url.pathname.startsWith('/api/records') && req.method !== 'GET';
  
  if (isProtectedUI || isProtectedAPI) {
    const adminToken = req.cookies.get('admin_token');

    if (adminToken && adminToken.value === 'authenticated') {
      return NextResponse.next();
    }
    
    // If it's an API request, return 401 JSON
    if (isProtectedAPI) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If it's a UI request to /admin, redirect them to the custom login page
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Only run middleware on these specific paths to save performance
export const config = {
  matcher: ['/admin/:path*', '/api/records/:path*'],
};
