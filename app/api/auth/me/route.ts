import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type JwtPayload = {
  sub?: string | number;
  email?: string;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('client_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not logged in' },
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

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userId =
      typeof payload.sub === 'string'
        ? Number.parseInt(payload.sub, 10)
        : payload.sub;

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const {
      password: _password,
      refreshToken: _refreshToken,
      refreshTokenExpiresAt: _refreshTokenExpiresAt,
      clientRefreshToken: _clientRefreshToken,
      clientRefreshTokenExpiresAt: _clientRefreshTokenExpiresAt,
      deletedAt: _deletedAt,
      ...safeUser
    } = user;

    const publicUser = {
      ...safeUser,
      id: String(user.id),
    };

    return NextResponse.json(
      {
        success: true,
        data: publicUser,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { success: false, error: 'Error getting session' },
      { status: 500 }
    );
  }
}
