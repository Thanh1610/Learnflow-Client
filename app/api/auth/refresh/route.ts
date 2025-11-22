import { hasura } from '@/lib/hasura';
import { signToken } from '@/lib/jwt';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('client_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Tìm user với client refresh token hợp lệ (chưa hết hạn và chưa bị xóa)
    const escapedRefreshToken = JSON.stringify(refreshToken);
    const now = new Date().toISOString();
    const escapedNow = JSON.stringify(now);

    const findUserQuery = `
      query FindUserByClientRefreshToken {
        user(
          where: {
            _and: [
              { clientRefreshToken: { _eq: ${escapedRefreshToken} } }
              { clientRefreshTokenExpiresAt: { _gt: ${escapedNow} } }
              { deletedAt: { _is_null: true } }
            ]
          }
        ) {
          id
          email
          name
          role
        }
      }
    `;

    const userResult = await hasura<{
      user: Array<{
        id: number;
        email: string;
        name: string | null;
        role: string;
      }>;
    }>(findUserQuery);

    if (!userResult.user || userResult.user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const user = userResult.user[0];

    // Tạo access token mới
    const newAccessToken = signToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      ACCESS_TOKEN_MAX_AGE_SECONDS
    );

    // Tạo client refresh token mới
    const newClientRefreshToken = randomBytes(48).toString('hex');
    const newClientRefreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000
    ).toISOString();

    // Cập nhật client refresh token mới vào database
    const escapedNewRefreshToken = JSON.stringify(newClientRefreshToken);
    const escapedNewExpiresAt = JSON.stringify(newClientRefreshTokenExpiresAt);
    const updateUserMutation = `
      mutation UpdateUserClientRefreshToken {
        updateUserById(
          keyId: ${user.id}
          updateColumns: {
            clientRefreshToken: { set: ${escapedNewRefreshToken} }
            clientRefreshTokenExpiresAt: { set: ${escapedNewExpiresAt} }
          }
        ) {
          returning {
            id
          }
        }
      }
    `;

    try {
      await hasura(updateUserMutation);
    } catch (updateError) {
      console.error('Failed to update client refresh token:', updateError);
      // Continue even if update fails - new tokens are still generated
    }

    // Exclude sensitive fields from user object
    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json(
      {
        success: true,
        data: publicUser,
        token: newAccessToken,
      },
      { status: 200 }
    );

    // Set new cookies
    response.cookies.set('client_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    response.cookies.set('client_refresh_token', newClientRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh token',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}
