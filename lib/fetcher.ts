export interface FetchError<T = unknown> extends Error {
  status: number;
  info?: T;
}

type FetcherInit<TBody> = Omit<RequestInit, 'body'> & { body?: TBody };

const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const VERCEL_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const SERVER_BASE_URL = VERCEL_URL ?? process.env.ADMIN_URL;

const JSON_MIME = 'application/json';

const isJsonContentType = (contentType?: string | null) =>
  Boolean(contentType?.includes(JSON_MIME));

async function drainResponse(response: Response) {
  const parseAsJson = isJsonContentType(response.headers.get('content-type'));
  return parseAsJson ? response.json() : response.text();
}

function buildRequestInit<TBody>(init?: FetcherInit<TBody>): RequestInit {
  const method = init?.method ?? (init?.body ? 'POST' : 'GET');
  const headers = {
    ...defaultHeaders,
    ...(init?.headers ?? {}),
  };
  const body =
    typeof init?.body === 'string' || init?.body === undefined
      ? (init?.body as BodyInit | null | undefined)
      : JSON.stringify(init?.body);

  return {
    ...init,
    method,
    headers,
    body,
  };
}

function buildFetchError(status: number, payload: unknown): FetchError {
  const message =
    typeof payload === 'object' && payload !== null && 'error' in payload
      ? ((payload as { error?: string }).error ?? 'Request failed')
      : 'Request failed';

  const error = new Error(message) as FetchError;
  error.status = status;
  error.info = payload;

  return error;
}

function buildRefreshUrl() {
  if (typeof window !== 'undefined') {
    return '/api/auth/refresh';
  }

  try {
    return new URL('/api/auth/refresh', SERVER_BASE_URL).toString();
  } catch (error) {
    console.error('Failed to build refresh URL:', error);
    return '/api/auth/refresh';
  }
}

async function refreshAuthTokens() {
  const refreshUrl = buildRefreshUrl();

  try {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      await drainResponse(response);
      return false;
    }

    await drainResponse(response);
    return true;
  } catch (error) {
    console.error('Failed to refresh auth tokens:', error);
    return false;
  }
}

export async function fetcher<TResponse = unknown, TBody = unknown>(
  input: RequestInfo,
  init?: FetcherInit<TBody>
): Promise<TResponse> {
  const requestInit = buildRequestInit(init);

  const sendRequest = async (hasRefreshed = false): Promise<TResponse> => {
    const response = await fetch(input, {
      ...requestInit,
      credentials: 'include',
    });

    const payload = await drainResponse(response);

    if (response.ok) {
      return payload as TResponse;
    }

    if (response.status === 401 && !hasRefreshed) {
      const refreshed = await refreshAuthTokens();
      if (refreshed) {
        return sendRequest(true);
      }
    }

    throw buildFetchError(response.status, payload);
  };

  return sendRequest();
}

export default fetcher;
