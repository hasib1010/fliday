import { NextResponse } from 'next/server';

export function middleware(request) {
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/auth/signin')
  ) {
    console.log(`🔐 Auth request: ${request.method} ${request.nextUrl.pathname}`);
    const cookies = request.cookies;
    const cookieNames = cookies.getAll().map(c => c.name);
    console.log(`🍪 Cookies:`, cookieNames.join(', ') || 'none');
    const stateCookie = cookies.get('next-auth.state');
    console.log(`🔑 State cookie:`, stateCookie ? `Present (value: ${stateCookie.value})` : 'Missing');
    if (request.nextUrl.pathname.includes('/callback') && !stateCookie) {
      console.warn('⚠️ State cookie missing on callback route', {
        url: request.nextUrl.toString(),
        headers: Object.fromEntries(request.headers.entries()),
      });
    }
    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get('error');
    if (error) {
      console.log(`❌ AUTH ERROR: ${error}`, {
        provider: searchParams.get('provider') || 'unknown',
        callbackUrl: searchParams.get('callbackUrl') || 'not specified',
        state: searchParams.get('state') || 'not provided',
      });
    }
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (request.nextUrl.pathname.includes('/signin')) {
      response.headers.set('Set-Cookie', 'next-auth.state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      console.log('🧹 Cleared stale state cookie on sign-in route');
    }
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*', '/auth/signin'],
};