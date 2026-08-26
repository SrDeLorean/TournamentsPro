// =============================================================================
// TournamentsPro — Client-side Fetch Utilities
// =============================================================================

/** Returns the common headers for cookie-authenticated API requests. */
export function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Wrapper around fetch that automatically includes auth headers.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(getAuthHeaders());
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  
  return fetch(url, {
    ...options,
    credentials: options.credentials || 'same-origin',
    headers,
  });
}

/** Fetch JSON through the shared cookie-authenticated transport. */
export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, options);
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof payload.error === 'string' ? payload.error : `Error ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

/**
 * Parse standardized API response. Handles both old { data } and new { data: { ... } } formats.
 */
export function parseApiResponse<T>(json: Record<string, unknown>): { success: boolean; data: T | null; error?: string } {
  if (json.success === false) {
    return { success: false, data: null, error: (json.error as string) || 'Error desconocido' };
  }

  const data = (json.data || json) as T;
  return { success: true, data };
}
