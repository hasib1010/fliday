import { NextResponse } from 'next/server';

export function middleware(request) {
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/auth/signin')
  ) {
    console.log(`🔐 Auth request: ${request.method} ${request.nextUrl.pathname}`);
    const cookies = request.cookies;
    const cookieNames = cookies.getAll().map(c => c.name);
    console.log(`🍪 Cookies received:`, cookieNames.join(', ') || 'none');
    const pkceCookie = cookies.get('next-auth.pkce.code_verifier');
    const stateCookie = cookies.get('next-auth.state');
    console.log(`🔑 PKCE cookie:`, pkceCookie ? `Present (value: ${pkceCookie.value})` : 'Missing');
    console.log(`🔑 State cookie:`, stateCookie ? `Present (value: ${stateCookie.value})` : 'Missing');
    
    const host = request.headers.get('host');
    console.log(`🌐 Host header:`, host || 'not provided');

    if (request.nextUrl.pathname.includes('/callback/apple')) {
      console.log('Apple callback details:', {
        url: request.nextUrl.toString(),
        headers: {
          host: host,
          cookie: request.headers.get('cookie') || 'none',
          referer: request.headers.get('referer') || 'none',
        },
        method: request.method,
        body: request.method === 'POST' ? 'Form POST data (not logged)' : 'N/A',
        cookies: cookieNames,
      });
      if (!pkceCookie) {
        console.warn('⚠️ PKCE code_verifier cookie missing on Apple callback', {
          url: request.nextUrl.toString(),
          headers: {
            host: host,
            cookie: request.headers.get('cookie') || 'none',
          },
        });
      }
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
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      console.log(`📤 Set-Cookie headers:`, setCookieHeaders);
    } else {
      console.log(`📤 Set-Cookie headers: none`);
    }
    
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*', '/auth/signin'],
};