import { Provider as UserProvider } from '@/app/generated/prisma/enums';
import {
  applyAuthCookies,
  clearAuthCookies,
  issueTokensForUser,
} from '@/lib/auth-tokens';
import prisma from '@/lib/prisma';
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

async function ensureUserRecord(user: NextAuthUser, account?: Account | null) {
  if (!user.email || !account) {
    return;
  }

  const providerType =
    account.provider === 'google'
      ? UserProvider.GOOGLE
      : account.provider === 'github'
        ? UserProvider.GITHUB
        : null;

  if (!providerType) {
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existingUser) {
    const updates: Record<string, unknown> = {};

    if (account.provider === 'google' && !existingUser.googleId) {
      updates.googleId = account.providerAccountId;
    }

    if (account.provider === 'github' && !existingUser.githubId) {
      updates.githubId = account.providerAccountId;
    }

    if (user.name && user.name !== existingUser.name) {
      updates.name = user.name;
    }

    if (!existingUser.avatar && user.image) {
      updates.avatar = user.image;
    }

    if (existingUser.provider !== providerType) {
      updates.provider = providerType;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updates,
      });
    }

    return;
  }

  await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      avatar: user.image,
      provider: providerType,
      ...(account.provider === 'google'
        ? { googleId: account.providerAccountId }
        : account.provider === 'github'
          ? { githubId: account.providerAccountId }
          : {}),
    },
  });
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
        await ensureUserRecord(user, account);

        if (!user.email) {
          return;
        }

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        if (!dbUser) {
          return;
        }

        const { token, clientRefreshToken } = await issueTokensForUser(dbUser);
        applyAuthCookies(await cookies(), token, clientRefreshToken);
      } catch (error) {
        console.error('Cannot save OAuth user information:', error);
      }
    },
    async signOut() {
      clearAuthCookies(await cookies());
    },
  },
  callbacks: {
    async jwt({ token }) {
      const enrichedToken = token as TokenWithMeta;

      if (!enrichedToken.email) {
        return enrichedToken;
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: enrichedToken.email },
        select: {
          id: true,
          role: true,
          avatar: true,
        },
      });

      if (dbUser) {
        enrichedToken.sub = String(dbUser.id);
        enrichedToken.role = dbUser.role;
        enrichedToken.avatar = dbUser.avatar;
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
