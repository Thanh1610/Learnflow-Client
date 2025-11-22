import type { NextRequest } from 'next/server';

export const REFRESH_ENDPOINT = '/api/auth/refresh';
export const ACCESS_TOKEN_COOKIE = 'client_token';
export const REFRESH_TOKEN_COOKIE = 'client_refresh_token';
const SESSION_COOKIES = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE] as const;

export async function attemptSessionRefresh(request: NextRequest) {
  try {
    const refreshUrl = new URL(REFRESH_ENDPOINT, request.url);
    const refreshResponse = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      return null;
    }

    const headerWithGetSetCookie = refreshResponse.headers as Headers & {
      getSetCookie?: () => string[];
    };

    const setCookieHeaders =
      headerWithGetSetCookie.getSetCookie?.() ??
      mapSingleCookieHeader(refreshResponse.headers.get('set-cookie'));

    if (setCookieHeaders.length === 0) {
      return null;
    }

    return setCookieHeaders.filter(cookie =>
      SESSION_COOKIES.some(name => cookie.startsWith(`${name}=`))
    );
  } catch (error) {
    console.warn('Failed to refresh auth session', error);
    return null;
  }
}

function mapSingleCookieHeader(headerValue: string | null) {
  if (!headerValue) return [];
  return [headerValue];
}
