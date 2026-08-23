'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/fetch-utils';

// ── Query Keys ──────────────────────────────────────────────────────────────

export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (filters?: { gameSlug?: string; page?: number; limit?: number }) =>
      ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: (filters?: { gameSlug?: string; page?: number; limit?: number }) =>
      ['teams', 'list', filters] as const,
    detail: (id: string) => ['teams', 'detail', id] as const,
  },
};

// ── Generic Fetch Helper ────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options?.headers || {}) },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as Record<string, string>).error || `Error ${res.status}`);
  }

  const json = await res.json();
  return json.data || json;
}

// ── Users Hooks ─────────────────────────────────────────────────────────────

interface UsersListResult {
  users: Record<string, unknown>[];
}

export function useUsers(filters?: { gameSlug?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.gameSlug && filters.gameSlug !== 'ALL') params.set('gameSlug', filters.gameSlug);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  const url = `/api/users${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => apiFetch<UsersListResult>(url),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id || ''),
    queryFn: () => apiFetch<{ user: Record<string, unknown> }>(`/api/users?id=${id}`),
    enabled: !!id,
  });
}

// ── Teams Hooks ─────────────────────────────────────────────────────────────

interface TeamsListResult {
  teams: Record<string, unknown>[];
}

export function useTeamsQuery(filters?: { gameSlug?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.gameSlug && !['ALL', 'all', 'TODOS'].includes(filters.gameSlug)) {
    params.set('gameSlug', filters.gameSlug);
  }
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  const url = `/api/teams${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: queryKeys.teams.list(filters),
    queryFn: () => apiFetch<TeamsListResult>(url),
  });
}

// ── Mutation Hooks ──────────────────────────────────────────────────────────

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error actualizando usuario');
      return json.data || json;
    },
    onSuccess: (_data, variables) => {
      // Invalidate user queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id as string) });
      }
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamData: Record<string, unknown>) => {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(teamData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error creando equipo');
      return json.data || json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamData: Record<string, unknown>) => {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(teamData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error actualizando equipo');
      return json.data || json;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(variables.id as string) });
      }
    },
  });
}
