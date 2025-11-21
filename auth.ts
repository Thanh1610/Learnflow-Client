import {
  applyAuthCookies,
  clearAuthCookies,
  issueTokensForUser,
} from '@/lib/auth-tokens';
import { hasuraPost } from '@/lib/hasura';
import type { Account, User as NextAuthUser } from 'next-auth';
import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { cookies } from 'next/headers';

type TokenWithMeta = JWT & {
  role?: string;
  avatar?: string | null;
};

const GENERAL_DEPARTMENT_NAME = 'General Department';

async function ensureUserRecord(user: NextAuthUser, account?: Account | null) {
  if (!user.email || !account) {
    return;
  }

  const emailString = String(user.email).trim().toLowerCase();
  const escapedEmail = JSON.stringify(emailString);
  const provider = account.provider === 'google' ? 'GOOGLE' : 'GITHUB';
  const googleId =
    account.provider === 'google' ? account.providerAccountId : null;
  const githubId =
    account.provider === 'github' ? account.providerAccountId : null;

  try {
    // 1. Kiểm tra user đã tồn tại chưa (theo email hoặc googleId/githubId tùy provider)
    let findUserQuery = '';
    if (googleId) {
      const escapedGoogleId = JSON.stringify(googleId);
      findUserQuery = `
        query FindUserForSocialLogin {
          user(where: { _and: [
            { _or: [
              { email: { _eq: ${escapedEmail} } },
              { googleId: { _eq: ${escapedGoogleId} } }
            ] },
            { deletedAt: { _is_null: true } }
          ] }) {
            id
            email
            name
            role
            provider
            googleId
            githubId
          }
        }
      `;
    } else if (githubId) {
      const escapedGithubId = JSON.stringify(githubId);
      findUserQuery = `
        query FindUserForSocialLogin {
          user(where: { _and: [
            { _or: [
              { email: { _eq: ${escapedEmail} } },
              { githubId: { _eq: ${escapedGithubId} } }
            ] },
            { deletedAt: { _is_null: true } }
          ] }) {
            id
            email
            name
            role
            provider
            googleId
            githubId
          }
        }
      `;
    } else {
      findUserQuery = `
        query FindUserForSocialLogin {
          user(where: { _and: [
            { email: { _eq: ${escapedEmail} } },
            { deletedAt: { _is_null: true } }
          ] }) {
            id
            email
            name
            role
            provider
            googleId
            githubId
          }
        }
      `;
    }

    const userResult = await hasuraPost<{
      user: Array<{
        id: number;
        email: string;
        name: string | null;
        role: string;
        provider: string;
        googleId: string | null;
        githubId: string | null;
      }>;
    }>(findUserQuery);

    let existingUser =
      userResult.user && userResult.user.length > 0 ? userResult.user[0] : null;

    // 2. Nếu user chưa tồn tại, tạo user mới
    if (!existingUser) {
      // Tìm hoặc tạo General Department
      const findDepartmentQuery = `
        query FindDepartment {
          department(where: { _and: [{ name: { _eq: ${JSON.stringify(GENERAL_DEPARTMENT_NAME)} } }, { deletedAt: { _is_null: true } }] }) {
            id
          }
        }
      `;

      const departmentResult = await hasuraPost<{
        department: Array<{ id: number }>;
      }>(findDepartmentQuery);

      let departmentId: number;

      if (
        departmentResult.department &&
        departmentResult.department.length > 0
      ) {
        departmentId = departmentResult.department[0].id;
      } else {
        // Tạo General Department nếu chưa có
        const now = new Date().toISOString();
        const createDepartmentMutation = `
          mutation CreateDepartment {
            insertDepartment(objects: [{ name: ${JSON.stringify(GENERAL_DEPARTMENT_NAME)}, updatedAt: ${JSON.stringify(now)} }]) {
              returning {
                id
              }
            }
          }
        `;

        const createDeptResult = await hasuraPost<{
          insertDepartment: { returning: Array<{ id: number }> };
        }>(createDepartmentMutation);

        if (
          !createDeptResult.insertDepartment.returning ||
          createDeptResult.insertDepartment.returning.length === 0
        ) {
          throw new Error('Failed to create General Department');
        }

        departmentId = createDeptResult.insertDepartment.returning[0].id;
      }

      // Tạo user mới
      const now = new Date().toISOString();
      const userObject: Record<string, unknown> = {
        email: emailString,
        role: 'USER',
        provider,
        updatedAt: now,
      };

      if (user.name) {
        userObject.name = user.name;
      }

      if (googleId) {
        userObject.googleId = googleId;
      }

      if (githubId) {
        userObject.githubId = githubId;
      }

      const createUserMutation = `
        mutation CreateUser($objects: [InsertUserObjectInput!]!) {
          insertUser(objects: $objects) {
            returning {
              id
              email
              name
              role
            }
          }
        }
      `;

      const createUserResult = await hasuraPost<{
        insertUser: {
          returning: Array<{
            id: number;
            email: string;
            name: string | null;
            role: string;
          }>;
        };
      }>(createUserMutation, {
        objects: [userObject],
      });

      if (
        !createUserResult.insertUser.returning ||
        createUserResult.insertUser.returning.length === 0
      ) {
        throw new Error('Failed to create user');
      }

      const newUser = createUserResult.insertUser.returning[0];
      const userId = newUser.id;

      // Link user vào General Department
      try {
        const linkUserDepartmentMutation = `
          mutation LinkUserDepartment($objects: [InsertUserDepartmentsObjectInput!]!) {
            insertUserDepartments(objects: $objects) {
              returning {
                a
                b
              }
            }
          }
        `;

        await hasuraPost(linkUserDepartmentMutation, {
          objects: [{ a: userId, b: departmentId }],
        });
      } catch (linkError) {
        console.error('Failed to link user to department:', linkError);
        // Continue even if linking fails - user is already created
      }

      existingUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        provider,
        googleId,
        githubId,
      };
    } else {
      // 3. Nếu user đã tồn tại nhưng chưa có googleId/githubId, cập nhật
      const needsUpdate =
        (googleId && !existingUser.googleId) ||
        (githubId && !existingUser.githubId);

      if (needsUpdate) {
        const escapedProvider = JSON.stringify(provider);
        const now = new Date().toISOString();
        const escapedUpdatedAt = JSON.stringify(now);
        const updateColumns: Record<string, { set: string }> = {
          provider: { set: escapedProvider },
          updatedAt: { set: escapedUpdatedAt },
        };

        if (googleId && !existingUser.googleId) {
          updateColumns.googleId = { set: JSON.stringify(googleId) };
        }

        if (githubId && !existingUser.githubId) {
          updateColumns.githubId = { set: JSON.stringify(githubId) };
        }

        const updateColumnsString = Object.entries(updateColumns)
          .map(([key, value]) => `${key}: { set: ${value.set} }`)
          .join('\n                ');

        const updateUserMutation = `
          mutation UpdateUserSocialId {
            updateUserById(
              keyId: ${existingUser.id}
              updateColumns: {
                ${updateColumnsString}
              }
            ) {
              returning {
                id
              }
            }
          }
        `;

        try {
          await hasuraPost(updateUserMutation);
          if (googleId) {
            existingUser.googleId = googleId;
          }
          if (githubId) {
            existingUser.githubId = githubId;
          }
          existingUser.provider = provider;
        } catch (updateError) {
          console.error('Failed to update user social ID:', updateError);
          // Continue even if update fails
        }
      }
    }

    return existingUser;
  } catch (error) {
    console.error('Error ensuring user record:', error);
    throw error;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Github({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  events: {
    async signIn({ user, account }) {
      try {
        const dbUser = await ensureUserRecord(user, account);
        if (dbUser) {
          // Tạo và lưu tokens vào database
          try {
            const tokens = await issueTokensForUser({
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
            });
            // Set cookies ngay sau khi tạo tokens
            const cookieStore = await cookies();
            applyAuthCookies(
              cookieStore,
              tokens.token,
              tokens.clientRefreshToken
            );
          } catch (tokenError) {
            console.error('Failed to issue tokens:', tokenError);
            // Continue even if token generation fails
          }
        }
      } catch (error) {
        console.error('Cannot save OAuth user information:', error);
      }
    },
    async signOut() {
      clearAuthCookies(await cookies());
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const enrichedToken = token as TokenWithMeta;

      // Khi sign in lần đầu, user object có sẵn
      if (user && user.email) {
        // Lấy thông tin user từ database
        const emailString = String(user.email).trim().toLowerCase();
        const escapedEmail = JSON.stringify(emailString);
        const findUserQuery = `
          query FindUserForJWT {
            user(where: { _and: [{ email: { _eq: ${escapedEmail} } }, { deletedAt: { _is_null: true } }] }) {
              id
              email
              name
              role
            }
          }
        `;

        try {
          const userResult = await hasuraPost<{
            user: Array<{
              id: number;
              email: string;
              name: string | null;
              role: string;
            }>;
          }>(findUserQuery);

          if (userResult.user && userResult.user.length > 0) {
            const dbUser = userResult.user[0];
            enrichedToken.sub = String(dbUser.id);
            enrichedToken.email = dbUser.email;
            enrichedToken.role = dbUser.role;
            if (dbUser.name) {
              enrichedToken.name = dbUser.name;
            }
            if (user.image) {
              enrichedToken.avatar = user.image;
            }
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }

      // Nếu đã có sub (user id) nhưng chưa có role, fetch lại từ database
      if (enrichedToken.sub && !enrichedToken.role && enrichedToken.email) {
        const escapedEmail = JSON.stringify(enrichedToken.email);
        const findUserQuery = `
          query FindUserForJWT {
            user(where: { _and: [{ email: { _eq: ${escapedEmail} } }, { deletedAt: { _is_null: true } }] }) {
              id
              role
              name
            }
          }
        `;

        try {
          const userResult = await hasuraPost<{
            user: Array<{
              id: number;
              role: string;
              name: string | null;
            }>;
          }>(findUserQuery);

          if (userResult.user && userResult.user.length > 0) {
            const dbUser = userResult.user[0];
            enrichedToken.role = dbUser.role;
            if (dbUser.name) {
              enrichedToken.name = dbUser.name;
            }
          }
        } catch (error) {
          console.error('Error fetching user role in JWT callback:', error);
        }
      }

      return enrichedToken;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      const enrichedToken = token as TokenWithMeta;
      const sessionUser = session.user as typeof session.user & {
        id?: string;
        role?: string;
      };

      if (enrichedToken.sub) {
        sessionUser.id = enrichedToken.sub;
      }

      if (enrichedToken.role) {
        sessionUser.role = enrichedToken.role;
      }

      if (Object.prototype.hasOwnProperty.call(enrichedToken, 'avatar')) {
        sessionUser.image = enrichedToken.avatar ?? sessionUser.image ?? null;
      }

      return session;
    },
  },
});
