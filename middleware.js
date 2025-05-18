// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only log auth-related routes
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname.startsWith('/auth/signin')) {
    
    console.log(`🔐 Auth request: ${request.method} ${request.nextUrl.pathname}`);
    
    // Log cookie information for debugging
    const cookies = request.cookies;
    const cookieCount = cookies.size;
    const cookieNames = Array.from(cookies.getAll()).map(c => c.name);
    
    console.log(`🍪 Cookies (${cookieCount}):`, cookieCount > 0 ? cookieNames.join(', ') : 'none');
    
    // Specifically check for NextAuth cookies
    const authCookies = cookieNames.filter(name => name.startsWith('next-auth'));
    if (authCookies.length > 0) {
      console.log('📝 NextAuth cookies:', authCookies.join(', '));
    }
    
    // Check for PKCE cookie specifically
    const hasPkceCookie = cookies.has('next-auth.pkce.code_verifier');
    console.log(`🔑 PKCE cookie present: ${hasPkceCookie ? 'Yes' : 'No'}`);
    
    // Extract and log query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {};
    searchParams.forEach((value, key) => {
      // Don't log sensitive values like tokens
      if (['code', 'token', 'id_token'].includes(key)) {
        params[key] = '[REDACTED]';
      } else {
        params[key] = value;
      }
    });
    
    if (Object.keys(params).length > 0) {
      console.log('📊 Auth params:', params);
    }
    
    // Log specific error scenarios
    const error = searchParams.get('error');
    if (error) {
      console.log(`❌ AUTH ERROR: ${error}`);
      
      // Enhanced logging for OAuth callback errors
      if (error === 'OAuthCallback' || error === 'OAuthCallbackError') {
        console.log('🔍 OAuth callback error details:');
        console.log('- Provider:', searchParams.get('provider') || 'unknown');
        console.log('- Callback URL:', searchParams.get('callbackUrl') || 'not specified');
        console.log('- Common causes:');
        console.log('  1. Missing or invalid cookies (especially PKCE cookies)');
        console.log('  2. OAuth provider configuration issues');
        console.log('  3. Callback URL mismatch with provider settings');
      }
    }
    
    // Add security headers for auth routes
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
  
  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/api/auth/:path*',
    '/auth/signin'
  ],
};