import { hasura } from '@/lib/hasura';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('client_refresh_token')?.value;

    // Clear client refresh token trong database nếu có
    if (refreshToken) {
      const escapedRefreshToken = JSON.stringify(refreshToken);

      // Tìm user bằng clientRefreshToken trước
      const findUserQuery = `
        query FindUserByClientRefreshToken {
          User(where: { clientRefreshToken: { _eq: ${escapedRefreshToken} } }) {
            id
          }
        }
      `;

      try {
        const userResult = await hasura<{
          User: Array<{ id: number }>;
        }>(findUserQuery);

        if (userResult.User && userResult.User.length > 0) {
          const userId = userResult.User[0].id;
          const clearRefreshTokenMutation = `
            mutation ClearUserClientRefreshToken($id: Int!) {
              update_User_by_pk(
                pk_columns: { id: $id }
                _set: {
                  clientRefreshToken: null
                  clientRefreshTokenExpiresAt: null
                }
              ) {
                  id
              }
            }
          `;

          await hasura(clearRefreshTokenMutation, { id: userId });
        }
      } catch (updateError) {
        console.error('Failed to clear client refresh token:', updateError);
        // Continue even if update fails - cookies will still be cleared
      }
    }

    // Xóa cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    response.cookies.set('client_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('client_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to logout',
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
