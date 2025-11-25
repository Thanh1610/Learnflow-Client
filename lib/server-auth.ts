import { hasura } from '@/lib/hasura';
import { verifyToken } from '@/lib/jwt';
import type { UserType } from '@/types/user.type';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Lấy JWT payload từ cookie (server-side)
 * @returns JWTPayload hoặc null nếu không có token hoặc token invalid
 */
export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('client_token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

/**
 * Lấy user data từ database (server-side)
 * @param userId User ID (number)
 * @returns UserType hoặc null nếu không tìm thấy
 */
export async function getUserById(userId: number): Promise<UserType | null> {
  try {
    if (!userId) {
      return null;
    }

    const escapedUserId = JSON.stringify(userId);
    const findUserQuery = `
      query GetUserById {
        User(where: { _and: [{ id: { _eq: ${escapedUserId} } }, { deletedAt: { _is_null: true } }] }) {
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
          dateofbirth
        }
      }
    `;

    const userResult = await hasura<{
      User: Array<{
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
        dateofbirth: string | null;
      }>;
    }>(findUserQuery);

    if (!userResult.User || userResult.User.length === 0) {
      return null;
    }

    const dbUser = userResult.User[0];

    // Map to UserType format (id should be string, dateofbirth -> dateOfBirth)
    const user: UserType & { dateOfBirth?: string | null } = {
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
      dateOfBirth: dbUser.dateofbirth,
    };

    return user as UserType;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * @returns JWTPayload nếu authenticated
 */
export async function requireAuth() {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}
