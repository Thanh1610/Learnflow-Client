'use client';

import { useAuthSession } from '@/app/hooks/useAuthSession';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { useRouter } from 'next/navigation';

export function HomeSessionHydrator() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const setSession = useAuthStore(state => state.setSession);
  const clear = useAuthStore(state => state.clear);

  const shouldFetch = !user;

  useAuthSession({
    shouldFetch,
    onSuccess: payload => {
      if (payload.data) {
        setSession({
          user: payload.data,
          token: payload.token ?? null,
        });
        return;
      }

      // Nếu API trả về success nhưng không có data, clear và redirect
      clear();
      router.replace(PAGE_ROUTES.LOGIN);
    },
    onUnauthorized: () => {
      clear();
    },
    onError: error => {
      console.error('Error fetching user session:', error);
    },
  });

  return null;
}
