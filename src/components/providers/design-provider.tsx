'use client';

import * as React from 'react';
import {
  DEFAULT_DESIGN_PREFERENCES,
  DESIGN_STORAGE_KEY,
  designPreferencesToCss,
  normalizeDesignPreferences,
  type DesignPreferences,
} from '@/lib/design-system';

interface DesignContextValue {
  preferences: DesignPreferences;
  setPreferences: (next: Partial<DesignPreferences>) => void;
  resetPreferences: () => void;
}

const DesignContext = React.createContext<DesignContextValue | null>(null);
const DESIGN_CHANGE_EVENT = 'tournamentspro:design-change';
let cachedRaw: string | null = null;
let cachedPreferences = DEFAULT_DESIGN_PREFERENCES;

function getClientSnapshot() {
  try {
    const stored = window.localStorage.getItem(DESIGN_STORAGE_KEY);
    if (stored === cachedRaw) return cachedPreferences;
    cachedRaw = stored;
    cachedPreferences = stored ? normalizeDesignPreferences(JSON.parse(stored)) : DEFAULT_DESIGN_PREFERENCES;
    return cachedPreferences;
  } catch {
    return DEFAULT_DESIGN_PREFERENCES;
  }
}

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === DESIGN_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(DESIGN_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(DESIGN_CHANGE_EVENT, onStoreChange);
  };
}

function persistPreferences(preferences: DesignPreferences) {
  const normalized = normalizeDesignPreferences(preferences);
  const serialized = JSON.stringify(normalized);
  cachedRaw = serialized;
  cachedPreferences = normalized;
  window.localStorage.setItem(DESIGN_STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(DESIGN_CHANGE_EVENT));
}

function applyPreferences(preferences: DesignPreferences) {
  const root = document.documentElement;
  root.dataset.uiDensity = preferences.density;
  root.dataset.uiRadius = preferences.radius;
  root.dataset.uiMotion = preferences.motion;
  root.dataset.uiFont = preferences.font;

  for (const [property, value] of Object.entries(designPreferencesToCss(preferences))) {
    root.style.setProperty(property, value);
  }
}

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const preferences = React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => DEFAULT_DESIGN_PREFERENCES,
  );

  React.useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  const setPreferences = React.useCallback((next: Partial<DesignPreferences>) => {
    persistPreferences({ ...getClientSnapshot(), ...next });
  }, []);

  const resetPreferences = React.useCallback(() => {
    persistPreferences(DEFAULT_DESIGN_PREFERENCES);
  }, []);

  const value = React.useMemo(
    () => ({ preferences, setPreferences, resetPreferences }),
    [preferences, resetPreferences, setPreferences],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign() {
  const context = React.useContext(DesignContext);
  if (!context) throw new Error('useDesign debe utilizarse dentro de DesignProvider');
  return context;
}
