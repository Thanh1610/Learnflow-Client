import { PAGE_ROUTES } from '@/config/pageRoutes';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_ENDPOINT,
  REFRESH_TOKEN_COOKIE,
  attemptSessionRefresh,
} from '@/lib/middleware/sessionProxy';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const publicRoutes: string[] = [PAGE_ROUTES.LOGIN, PAGE_ROUTES.REGISTER];
const authRoutes: string[] = [PAGE_ROUTES.LOGIN, PAGE_ROUTES.REGISTER];
const publicPrefixes = ['/_next', '/static', '/favicon.ico', '/api/auth'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');
  const isRefreshRoute = pathname.startsWith(REFRESH_ENDPOINT);
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some(prefix => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.includes(pathname);

  let hasAuthToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const hasRefreshToken = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE));
  let refreshedCookies: string[] = [];

  const shouldAttemptRefresh =
    !hasAuthToken && hasRefreshToken && !isPublicRoute && !isRefreshRoute;

  if (shouldAttemptRefresh) {
    refreshedCookies = (await attemptSessionRefresh(request)) ?? [];
    if (refreshedCookies.length > 0) {
      hasAuthToken = true;
    }
  }

  if (isAuthRoute && hasAuthToken) {
    const homeUrl = new URL(PAGE_ROUTES.HOME, request.url);
    const redirectResponse = NextResponse.redirect(homeUrl);
    appendCookies(redirectResponse, refreshedCookies);
    return redirectResponse;
  }

  if (!isPublicRoute && !hasAuthToken) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const loginUrl = new URL(PAGE_ROUTES.LOGIN, request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    appendCookies(redirectResponse, refreshedCookies);
    return redirectResponse;
  }

  const response = NextResponse.next();
  appendCookies(response, refreshedCookies);
  return response;
}

function appendCookies(response: NextResponse, cookies: string[]) {
  cookies.forEach(cookie => {
    response.headers.append('set-cookie', cookie);
  });
}

export { auth as middleware } from '@/auth';
