import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login', '/register'];
const publicPrefixes = ['/_next', '/static', '/favicon.ico', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some(prefix => pathname.startsWith(prefix));
  const authToken = request.cookies.get('auth_token')?.value;

  if (!isPublicRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
