import { auth } from '@/auth';
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  issueTokensForUser,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from '@/lib/auth-tokens';
import { NextResponse } from 'next/server';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionUser = session.user as typeof session.user & {
      id?: string;
      role?: string;
    };

    const userId = parseInt(sessionUser.id || '', 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Tạo tokens cho user
    const tokens = await issueTokensForUser({
      id: userId,
      email: sessionUser.email!,
      role: sessionUser.role || 'USER',
    });

    // Tạo response với tokens
    const response = NextResponse.json(
      {
        success: true,
        client_token: tokens.token,
        client_refresh_token: tokens.clientRefreshToken,
      },
      { status: 200 }
    );

    // Set cookies trong response
    response.cookies.set('client_token', tokens.token, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    response.cookies.set('client_refresh_token', tokens.clientRefreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error generating OAuth tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate tokens',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
      },
      { status: 500 }
    );
  }
}
