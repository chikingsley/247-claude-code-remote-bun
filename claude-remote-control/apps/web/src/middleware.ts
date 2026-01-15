import { neonAuthMiddleware } from '@neondatabase/auth/next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // CRITICAL: When OAuth callback has verifier, use a non-matching loginUrl
  // This bypasses the buggy early return in neonAuthMiddleware and allows token exchange
  if (searchParams.has('neon_auth_session_verifier')) {
    const callbackMiddleware = neonAuthMiddleware({
      loginUrl: '/__neon_auth_never_match__',
    });
    return callbackMiddleware(request);
  }

  // Normal auth middleware for all other requests
  const authMiddleware = neonAuthMiddleware({
    loginUrl: '/auth/sign-in',
  });
  return authMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon-|apple-icon|manifest).*)'],
};
