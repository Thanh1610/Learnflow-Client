/**
 * Utility functions for working with cookies
 */

/**
 * Gets the locale value from cookies
 * @param defaultLocale - The default locale to return if no cookie is found (default: 'en')
 * @returns The locale string from cookie or the default locale
 */
export function getLocaleFromCookie(defaultLocale: string = 'en'): string {
  if (typeof window === 'undefined') return defaultLocale;

  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find(cookie =>
    cookie.trim().startsWith('locale=')
  );

  return localeCookie ? localeCookie.split('=')[1] : defaultLocale;
}

/**
 * Sets a locale cookie
 * @param locale - The locale string to set
 * @param options - Cookie options (path, maxAge, sameSite)
 */
export function setLocaleCookie(
  locale: string,
  options: {
    path?: string;
    maxAge?: number;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const {
    path = '/',
    maxAge = 31536000, // 1 year
    sameSite = 'Lax',
  } = options;

  document.cookie = `locale=${locale}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}`;
}
