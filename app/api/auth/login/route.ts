import { hasura } from '@/lib/hasura';
import { signToken } from '@/lib/jwt';
import { compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing fields' },
        { status: 400 }
      );
    }

    // Tìm user theo email (chỉ user chưa bị xóa) và lấy tất cả thông tin cần thiết trong một query
    // Đảm bảo email là string và trim
    const emailString = String(email).trim().toLowerCase();

    // Escape string cho GraphQL (tạm thời dùng inline string để bypass bug Hasura DDN với String type)
    const escapedEmail = JSON.stringify(emailString);

    const findUserQuery = `
      query FindUserForLogin {
        user(where: { _and: [{ email: { _eq: ${escapedEmail} } }, { deletedAt: { _is_null: true } }] }) {
          id
          email
          name
          role
          password
        }
      }
    `;

    console.log('Step 1: Finding user by email:', emailString);
    const userResult = await hasura<{
      user: Array<{
        id: number;
        email: string;
        name: string | null;
        role: string;
        password: string | null;
      }>;
    }>(findUserQuery);
    console.log('Step 1 result:', {
      ...userResult,
      user: userResult.user?.map(u => ({
        ...u,
        password: u.password ? '***' : null,
      })),
    });

    if (!userResult.user || userResult.user.length === 0) {
      console.log('User not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.user[0];
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    if (!user.password) {
      console.error('User password hash missing');
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Tạo access token
    const token = signToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      ACCESS_TOKEN_MAX_AGE_SECONDS
    );

    const clientRefreshToken = randomBytes(48).toString('hex');
    const clientRefreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000
    ).toISOString();

    // Cập nhật client refresh token vào database bằng Hasura mutation
    const escapedRefreshToken = JSON.stringify(clientRefreshToken);
    const escapedExpiresAt = JSON.stringify(clientRefreshTokenExpiresAt);
    const updateUserMutation = `
      mutation UpdateUserClientRefreshToken {
        updateUserById(
          keyId: ${user.id}
          updateColumns: {
            clientRefreshToken: { set: ${escapedRefreshToken} }
            clientRefreshTokenExpiresAt: { set: ${escapedExpiresAt} }
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
      // Continue even if update fails - token is still generated
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
        token,
      },
      { status: 200 }
    );

    response.cookies.set('client_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    response.cookies.set('client_refresh_token', clientRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to login',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to login',
      },
      { status: 500 }
    );
  }
}
