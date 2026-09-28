import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication or handle optional auth
const PUBLIC_ROUTES = [
  '/api/auth/me',
  '/api/auth/magic',
  '/api/auth/whatsapp-otp/send',
  '/api/auth/whatsapp-otp/verify',
  '/api/whatsapp',
  '/api/hermes',
  '/api/contacts',
  '/api/admin/tenants',
  '/api/relationships',
  '/api/calendar',
  '/api/deals',
  '/api/debug-logs',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public routes through
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get('crm_session');
  if (!sessionCookie?.value) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Cookie present — allow through (route will verify JWT validity)
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
