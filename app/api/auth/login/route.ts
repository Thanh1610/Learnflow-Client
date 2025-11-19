import { applyAuthCookies, issueTokensForUser } from '@/lib/auth-tokens';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';

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
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Account is not a local account' },
        { status: 400 }
      );
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
    const { token, clientRefreshToken } = await issueTokensForUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Exclude sensitive fields from user object
    const {
      password: _password,
      clientRefreshToken: _clientRefreshToken,
      clientRefreshTokenExpiresAt: _clientRefreshTokenExpiresAt,
      ...publicUser
    } = user;

    // Explicitly acknowledge stripped fields to satisfy lint rules
    void _password;
    void _clientRefreshToken;
    void _clientRefreshTokenExpiresAt;

    const response = NextResponse.json(
      {
        success: true,
        data: publicUser,
        token,
      },
      { status: 200 }
    );

    applyAuthCookies(response.cookies, token, clientRefreshToken);

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
