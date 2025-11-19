import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('auth_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Tìm user với refresh token hợp lệ
    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
        refreshTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Tạo access token mới
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS }
    );

    // Tạo refresh token mới (rotate refresh token)
    const newRefreshToken = randomBytes(48).toString('hex');
    const newRefreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000
    );

    // Cập nhật refresh token mới vào database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: newRefreshTokenExpiresAt,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        token,
      },
      { status: 200 }
    );

    // Set cookies mới
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    response.cookies.set('auth_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
