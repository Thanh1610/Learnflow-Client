import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setSession: (session: {
    user?: AuthUser | null;
    token?: string | null;
  }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: user =>
        set({
          user,
          isAuthenticated: Boolean(user ?? get().token),
        }),
      setToken: token =>
        set({
          token,
          isAuthenticated: Boolean(get().user ?? token),
        }),
      setSession: session => {
        const nextUser = session.user ?? get().user;
        const nextToken = session.token ?? get().token;
        set({
          user: nextUser,
          token: nextToken,
          isAuthenticated: Boolean(nextUser ?? nextToken),
        });
      },
      clear: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // Tên key trong localStorage
    }
  )
);
