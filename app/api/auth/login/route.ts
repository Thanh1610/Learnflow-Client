import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
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

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS }
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000
    );

    // Cập nhật refresh token vào database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiresAt,
      },
    });

    // Exclude sensitive fields from user object
    const {
      password: _password,
      refreshToken: _refreshToken,
      refreshTokenExpiresAt: _refreshTokenExpiresAt,
      ...publicUser
    } = user;

    // Explicitly acknowledge stripped fields to satisfy lint rules
    void _password;
    void _refreshToken;
    void _refreshTokenExpiresAt;

    const response = NextResponse.json(
      {
        success: true,
        data: publicUser,
        token,
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    response.cookies.set('auth_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
