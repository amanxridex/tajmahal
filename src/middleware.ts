import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // We want to protect the /admin page AND any requests that try to modify data (POST/DELETE to /api/records)
  const isProtectedUI = url.pathname.startsWith('/admin');
  const isProtectedAPI = url.pathname.startsWith('/api/records') && req.method !== 'GET';
  
  if (isProtectedUI || isProtectedAPI) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // We fall back to the hardcoded ones if environment variables aren't set yet, 
      // but they should be added to Vercel for maximum security!
      const validUser = process.env.ADMIN_USERNAME || 'admin';
      const validPwd = process.env.ADMIN_PASSWORD || 'admin';

      if (user === validUser && pwd === validPwd) {
        return NextResponse.next();
      }
    }
    
    // If not authenticated, force the browser to pop up a login prompt
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Admin Area"'
      }
    });
  }
}

// Only run middleware on these specific paths to save performance
export const config = {
  matcher: ['/admin/:path*', '/api/records/:path*'],
};
