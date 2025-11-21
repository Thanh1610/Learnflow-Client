export function getHasuraUrl(): string {
  return process.env.HASURA_URL || 'http://localhost:3280/graphql';
}

export function getHasuraAdminSecret(): string {
  const secret = process.env.HASURA_ADMIN_SECRET;
  if (!secret) {
    throw new Error(
      'HASURA_ADMIN_SECRET is not set. Please check your .env.local file.'
    );
  }
  return secret;
}

export function getHasuraHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': getHasuraAdminSecret(),
  };
}

export async function hasuraPost<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const url = getHasuraUrl();

  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Hasura POST request:', {
      url,
      hasVariables: !!variables && Object.keys(variables).length > 0,
      queryPreview: query.substring(0, 100) + '...',
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHasuraHeaders(),
      body: JSON.stringify({ query, variables: variables || {} }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hasura request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(
        `Hasura request failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (result.errors) {
      const errorMessages = result.errors
        .map((e: { message: string; path?: unknown; extensions?: unknown }) => {
          const baseMessage = e.message;
          const details = [];
          if (e.path) details.push(`path: ${JSON.stringify(e.path)}`);
          if (e.extensions)
            details.push(`extensions: ${JSON.stringify(e.extensions)}`);
          return details.length > 0
            ? `${baseMessage} (${details.join(', ')})`
            : baseMessage;
        })
        .join(', ');
      console.error(
        'Hasura GraphQL errors:',
        JSON.stringify(result.errors, null, 2)
      );
      throw new Error(`Hasura GraphQL errors: ${errorMessages}`);
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Hasura')) {
      throw error;
    }
    console.error('Hasura request error:', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Failed to connect to Hasura at ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function hasuraGet<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const baseUrl = getHasuraUrl();
  const params = new URLSearchParams({
    query,
    ...(variables &&
      Object.keys(variables).length > 0 && {
        variables: JSON.stringify(variables),
      }),
  });

  const url = `${baseUrl}?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'x-hasura-admin-secret': getHasuraAdminSecret() },
  });

  if (!response.ok) {
    throw new Error(`Hasura request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    const errorMessages = result.errors
      .map((e: { message: string }) => e.message)
      .join(', ');
    throw new Error(`Hasura GraphQL errors: ${errorMessages}`);
  }

  return result.data as T;
}
