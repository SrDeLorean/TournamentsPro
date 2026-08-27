'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, TeamData, initialTeams } from '@/lib/data-store';

type TeamApiRecord = TeamData & {
  game_slug?: string;
  captain_id?: string;
  captain_name?: string;
  logo_url?: string;
  banner_url?: string;
  logo?: string;
  banner?: string;
};

// ── Separate Contexts to prevent unnecessary re-renders ─────────────────────

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeGameSlug: string;
  setActiveGameSlug: (slug: string) => void;
  updateCurrentUser: (updatedData: Partial<UserProfile>) => void;
  refetchUser: () => Promise<void>;
  login: (emailOrGamertag: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  register: (data: Partial<UserProfile> & { password?: string }) => Promise<boolean>;
  logout: () => void;
}

interface TeamsContextType {
  userTeams: TeamData[];
  refetchTeams: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeGameSlug, setActiveGameSlug] = useState<string>('eafc26');
  const [userTeams, setUserTeams] = useState<TeamData[]>(initialTeams);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyAuthenticatedUser = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    if (user.primaryGame) {
      setActiveGameSlug(user.primaryGame);
    }
  }, []);

  const fetchGlobalTeams = useCallback(() => {
    fetch('/api/teams?limit=200')
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudieron cargar los equipos (${res.status})`);
        return res.json();
      })
      .then((data) => {
        const teams = data.teams || data.data?.teams;
        if (Array.isArray(teams) && teams.length > 0) {
          const normalizedTeams = (teams as TeamApiRecord[]).map((t): TeamData => ({
            ...t,
            gameSlug: (t.game_slug || t.gameSlug || 'eafc26') as TeamData['gameSlug'],
            captainId: t.captain_id || t.captainId,
            captainName: t.captain_name || t.captainName,
            logoUrl: t.logo_url || t.logoUrl || t.logo,
            bannerUrl: t.banner_url || t.bannerUrl || t.banner || '',
          }));
          setUserTeams(normalizedTeams);
        }
      })
      .catch((err) => console.error('Error fetching global teams:', err));
  }, []);

  useEffect(() => {
    fetchGlobalTeams();
  }, [fetchGlobalTeams]);

  // The HttpOnly cookie is the source of truth. Never hydrate identity or roles
  // from browser-controlled storage.
  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setCurrentUser(null);
          return;
        }

        const payload = await response.json();
        const user = payload.data?.user || payload.user;
        if (!cancelled && user) {
          applyAuthenticatedUser(user);
        }
      } catch (error) {
        console.error('Error verificando la sesión:', error);
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void hydrateSession();
    return () => {
      cancelled = true;
    };
  }, [applyAuthenticatedUser]);

  const login = useCallback(async (emailOrGamertag: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrGamertag, password }),
      });

      const data = await res.json();
      // Support both old { user } and new { data: { user } } response formats
      const user = data.data?.user || data.user;

      if (res.ok && user) {
        applyAuthenticatedUser(user);
        return true;
      } else {
        console.warn('Login falló:', data.error);
        return false;
      }
    } catch (err) {
      console.error('Error de red en login:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthenticatedUser]);

  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      const user = data.data?.user || data.user;
      if (!res.ok || !user) {
        console.warn('Login de Google falló:', data.error);
        return false;
      }

      applyAuthenticatedUser(user);
      return true;
    } catch (err) {
      console.error('Error de red en login de Google:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthenticatedUser]);

  const register = useCallback(async (data: Partial<UserProfile> & { password?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      const user = result.data?.user || result.user;

      if (res.ok && user) {
        applyAuthenticatedUser(user);
        return true;
      } else {
        console.warn('Register falló:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Error de red en register:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthenticatedUser]);

  const updateCurrentUser = useCallback((updatedData: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const newUser = prev ? { ...prev, ...updatedData } : (updatedData as UserProfile);
      window.dispatchEvent(new Event('user_profile_updated'));
      return newUser;
    });
  }, []);

  const refetchUser = useCallback(async () => {
    const userId = currentUser?.id;
    if (!userId) return;

    try {
      const res = await fetch(`/api/users?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const user = data.data?.user || data.user;
        if (user) {
          applyAuthenticatedUser(user);
          window.dispatchEvent(new Event('user_profile_updated'));
        }
      }
    } catch (err) {
      console.error('Error recargando perfil de usuario:', err);
    }
  }, [currentUser?.id, applyAuthenticatedUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    // Clear HttpOnly cookie by calling logout endpoint
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  // Memoize context values to prevent unnecessary re-renders
  const authValue = useMemo<AuthContextType>(() => ({
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    activeGameSlug,
    setActiveGameSlug,
    updateCurrentUser,
    refetchUser,
    login,
    loginWithGoogle,
    register,
    logout,
  }), [currentUser, isLoading, activeGameSlug, updateCurrentUser, refetchUser, login, loginWithGoogle, register, logout]);

  const teamsValue = useMemo<TeamsContextType>(() => ({
    userTeams,
    refetchTeams: fetchGlobalTeams,
  }), [userTeams, fetchGlobalTeams]);

  return (
    <AuthContext.Provider value={authValue}>
      <TeamsContext.Provider value={teamsValue}>
        {children}
      </TeamsContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Also merge teams context for backward compatibility
  const teamsContext = useContext(TeamsContext);
  return {
    ...context,
    userTeams: teamsContext?.userTeams || [],
    refetchTeams: teamsContext?.refetchTeams || (() => {}),
  };
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within an AuthProvider');
  }
  return context;
}
