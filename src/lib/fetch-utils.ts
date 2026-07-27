// =============================================================================
// TournamentsPro — Client-side Fetch Utilities
// =============================================================================

/**
 * Returns auth headers for API requests.
 * Reads the JWT token from localStorage.
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tournamentspro_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Wrapper around fetch that automatically includes auth headers.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
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
