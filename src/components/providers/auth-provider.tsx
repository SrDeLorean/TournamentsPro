'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, TeamData, initialTeams } from '@/lib/data-store';

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
  loginWithGoogle: (googleData?: { name?: string; email?: string; picture?: string }) => Promise<boolean>;
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

  const fetchGlobalTeams = useCallback(() => {
    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => {
        const teams = data.data?.teams || data.teams;
        if (Array.isArray(teams) && teams.length > 0) {
          setUserTeams(teams);
        }
      })
      .catch((err) => console.error('Error fetching global teams:', err));
  }, []);

  useEffect(() => {
    fetchGlobalTeams();
  }, [fetchGlobalTeams]);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('tournamentspro_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed.primaryGame) {
          setActiveGameSlug(parsed.primaryGame);
        }
      }
    } catch (e) {
      console.error('Error loading session from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const token = data.data?.token || data.token;

      if (res.ok && user) {
        setCurrentUser(user);
        localStorage.setItem('tournamentspro_session', JSON.stringify(user));
        if (token) {
          localStorage.setItem('tournamentspro_token', token);
        }
        if (user.primaryGame) {
          setActiveGameSlug(user.primaryGame);
        }
        setIsLoading(false);
        return true;
      } else {
        console.warn('Login falló:', data.error);
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error de red en login:', err);
      setIsLoading(false);
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (googleData?: { name?: string; email?: string; picture?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData || { name: 'Atleta Google', email: 'google.user@esports.com' }),
      });

      let user: UserProfile;

      if (res.ok) {
        const data = await res.json();
        user = data.data?.user || data.user;
      } else {
        user = {
          id: `usr-google-${Date.now()}`,
          name: googleData?.name || 'Atleta Google',
          gamertag: googleData?.name ? googleData.name.replace(/\s+/g, '') : 'GoogleGamer',
          role: 'Jugador',
          primaryGame: 'eafc26',
          platform: 'CROSSPLAY',
          position: 'DFC',
          status: 'Buscando Club',
          rating: '9.8',
        };
      }

      setCurrentUser(user);
      localStorage.setItem('tournamentspro_session', JSON.stringify(user));
      setIsLoading(false);
      return true;
    } catch (err) {
      const fallbackGoogleUser: UserProfile = {
        id: `usr-google-${Date.now()}`,
        name: 'Atleta Google',
        gamertag: 'GoogleGamer',
        role: 'Jugador',
        primaryGame: 'eafc26',
        platform: 'CROSSPLAY',
        position: 'DFC',
        status: 'Buscando Club',
        rating: '9.8',
      };
      setCurrentUser(fallbackGoogleUser);
      localStorage.setItem('tournamentspro_session', JSON.stringify(fallbackGoogleUser));
      setIsLoading(false);
      return true;
    }
  }, []);

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
      const token = result.data?.token || result.token;

      if (res.ok && user) {
        setCurrentUser(user);
        localStorage.setItem('tournamentspro_session', JSON.stringify(user));
        if (token) {
          localStorage.setItem('tournamentspro_token', token);
        }
        if (user.primaryGame) {
          setActiveGameSlug(user.primaryGame);
        }
        setIsLoading(false);
        return true;
      } else {
        console.warn('Register falló:', result.error);
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error de red en register:', err);
      setIsLoading(false);
      return false;
    }
  }, []);

  const updateCurrentUser = useCallback((updatedData: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const newUser = prev ? { ...prev, ...updatedData } : (updatedData as UserProfile);
      localStorage.setItem('tournamentspro_session', JSON.stringify(newUser));
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
          setCurrentUser(user);
          localStorage.setItem('tournamentspro_session', JSON.stringify(user));
          window.dispatchEvent(new Event('user_profile_updated'));
        }
      }
    } catch (err) {
      console.error('Error recargando perfil de usuario:', err);
    }
  }, [currentUser?.id]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('tournamentspro_session');
    localStorage.removeItem('tournamentspro_token');
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
