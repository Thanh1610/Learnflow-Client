import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

type MinimalUser = {
  id: number;
  email: string;
  role: string;
};

export type IssuedTokens = {
  token: string;
  clientRefreshToken: string;
  clientRefreshTokenExpiresAt: Date;
};

export async function issueTokensForUser(
  user: MinimalUser
): Promise<IssuedTokens> {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS }
  );

  const clientRefreshToken = randomBytes(48).toString('hex');
  const clientRefreshTokenExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      clientRefreshToken,
      clientRefreshTokenExpiresAt,
    },
  });

  return { token, clientRefreshToken, clientRefreshTokenExpiresAt };
}

type CookieSetter = {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      path?: string;
      maxAge?: number;
    }
  ) => void;
};

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function applyAuthCookies(
  cookiesStore: CookieSetter,
  token: string,
  clientRefreshToken: string
) {
  cookiesStore.set('client_token', token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  cookiesStore.set('client_refresh_token', clientRefreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(cookiesStore: CookieSetter) {
  cookiesStore.set('client_token', '', {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
  });

  cookiesStore.set('client_refresh_token', '', {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
