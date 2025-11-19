export interface FetchError<T = unknown> extends Error {
  status: number;
  info?: T;
}

const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export async function fetcher<TResponse = unknown, TBody = unknown>(
  input: RequestInfo,
  init?: Omit<RequestInit, 'body'> & { body?: TBody }
): Promise<TResponse> {
  const mergedInit: RequestInit = {
    method: init?.method ?? (init?.body ? 'POST' : 'GET'),
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init?.headers ?? {}),
    },
    body:
      typeof init?.body === 'string' || init?.body === undefined
        ? (init?.body as BodyInit | null | undefined)
        : JSON.stringify(init?.body),
  };

  const response = await fetch(input, mergedInit);

  const contentType = response.headers.get('content-type');
  const parseAsJson = contentType?.includes('application/json');
  const payload = parseAsJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(
      (payload as { error?: string })?.error ?? 'Request failed'
    ) as FetchError;
    error.status = response.status;
    error.info = payload;
    throw error;
  }

  return payload as TResponse;
}

export default fetcher;
