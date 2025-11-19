import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PAGE_ROUTES } from './config/pageRoutes';

const publicRoutes = ['/login', '/register'];
const publicPrefixes = ['/_next', '/static', '/favicon.ico', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some(prefix => pathname.startsWith(prefix));
  const authToken = request.cookies.get('client_token')?.value;

  if (!isPublicRoute && !authToken) {
    const loginUrl = new URL(PAGE_ROUTES.LOGIN, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export { auth as middleware } from '@/auth';
