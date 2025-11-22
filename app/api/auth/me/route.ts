import { hasura } from '@/lib/hasura';
import { verifyToken } from '@/lib/jwt';
import type { UserType } from '@/types/user.type';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Query user from Hasura
    const escapedUserId = JSON.stringify(userId);
    const findUserQuery = `
      query GetUserById {
        user(where: { _and: [{ id: { _eq: ${escapedUserId} } }, { deletedAt: { _is_null: true } }] }) {
          id
          email
          name
          role
          avatar
          address
          phone
          gender
          provider
          googleId
          githubId
          deletedAt
        }
      }
    `;

    const userResult = await hasura<{
      user: Array<{
        id: number;
        email: string;
        name: string | null;
        role: string;
        avatar: string | null;
        address: string | null;
        phone: string | null;
        gender: string | null;
        provider: string | null;
        googleId: string | null;
        githubId: string | null;
        deletedAt: string | null;
      }>;
    }>(findUserQuery);

    if (!userResult.user || userResult.user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const dbUser = userResult.user[0];

    // Map to UserType format (id should be string)
    const user: UserType = {
      id: String(dbUser.id),
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      avatar: dbUser.avatar,
      address: dbUser.address,
      phone: dbUser.phone,
      gender: dbUser.gender,
      provider: dbUser.provider,
      googleId: dbUser.googleId,
      githubId: dbUser.githubId,
      deletedAt: dbUser.deletedAt ? new Date(dbUser.deletedAt) : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: user,
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
