'use client';

import { useCallback, useEffect, useRef } from 'react';

interface WarmedTabDataOptions<T extends string> {
  scope?: string;
  activeTab: T;
  tabs: readonly T[];
  load: (tab: T) => Promise<boolean>;
  variant?: (tab: T) => string;
}

/** Loads the visible tab immediately, warms siblings, and reuses successful results. */
export function useWarmedTabData<T extends string>({ scope, activeTab, tabs, load, variant }: WarmedTabDataOptions<T>) {
  const loadedRef = useRef(new Set<string>());
  const inFlightRef = useRef(new Set<string>());
  const variantRef = useRef(variant);
  useEffect(() => { variantRef.current = variant; }, [variant]);

  const run = useCallback(async (tab: T, force = false) => {
    if (!scope) return;
    const key = `${scope}:${tab}:${variantRef.current?.(tab) ?? ''}`;
    if (!force && (loadedRef.current.has(key) || inFlightRef.current.has(key))) return;
    inFlightRef.current.add(key);
    try {
      if (await load(tab)) loadedRef.current.add(key);
    } finally {
      inFlightRef.current.delete(key);
    }
  }, [load, scope]);

  useEffect(() => {
    if (!scope) return;
    const timer = window.setTimeout(() => void run(activeTab), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, run, scope]);

  useEffect(() => {
    if (!scope) return;
    const timer = window.setTimeout(() => tabs.filter((tab) => tab !== activeTab).forEach((tab) => void run(tab)), 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, run, scope, tabs]);

  return run;
}
