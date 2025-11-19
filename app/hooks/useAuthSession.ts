'use client';

import { fetcher, type FetchError } from '@/lib/fetcher';
import type { UserType } from '@/types/user.type.ts';
import useSWR from 'swr';

export type AuthSessionResponse = {
  success: boolean;
  data: UserType | null;
  token?: string | null;
};

export type SessionFetcherError =
  | FetchError<AuthSessionResponse>
  | (Error & { status?: number });

const fetchAuthSession = async (url: string): Promise<AuthSessionResponse> => {
  const payload = await fetcher<AuthSessionResponse>(url);

  if (!payload?.success) {
    const error = new Error('Invalid auth payload') as SessionFetcherError;
    error.status = 500;
    throw error;
  }

  return payload;
};

type UseAuthSessionOptions = {
  shouldFetch: boolean;
  onSuccess?: (payload: AuthSessionResponse) => void;
  onUnauthorized?: () => void;
  onError?: (error: SessionFetcherError) => void;
};

export const useAuthSession = ({
  shouldFetch,
  onSuccess,
  onUnauthorized,
  onError,
}: UseAuthSessionOptions) =>
  useSWR<AuthSessionResponse, SessionFetcherError>(
    shouldFetch ? '/api/auth/me' : null,
    fetchAuthSession,
    {
      revalidateOnFocus: false,
      onSuccess,
      onError: error => {
        if ('status' in error && error.status === 401) {
          onUnauthorized?.();
          return;
        }
        onError?.(error);
      },
    }
  );
