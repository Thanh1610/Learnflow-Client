'use client';

import { type FetchError } from '@/lib/fetcher';

export function errorMessage(err: unknown) {
  const fetchError = err as FetchError<{ error?: string }>;
  if (err instanceof Error) {
    return err.message;
  }
  return fetchError.info?.error ?? 'Unexpected error';
}
