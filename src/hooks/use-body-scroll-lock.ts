'use client';

import { useEffect, useId } from 'react';

const activeOwners = new Set<string>();
let previousBodyOverflow: string | null = null;

export function acquireBodyScrollLock(owner: string) {
  if (typeof document === 'undefined' || activeOwners.has(owner)) return;

  if (activeOwners.size === 0) {
    previousBodyOverflow = document.body.style.overflow;
  }

  activeOwners.add(owner);
  document.body.style.overflow = 'hidden';
  document.body.dataset.scrollLocked = 'true';
}

export function releaseBodyScrollLock(owner: string) {
  if (typeof document === 'undefined' || !activeOwners.delete(owner)) return;
  if (activeOwners.size > 0) return;

  document.body.style.overflow = previousBodyOverflow ?? '';
  delete document.body.dataset.scrollLocked;
  previousBodyOverflow = null;
}

export function useBodyScrollLock(locked: boolean, namespace = 'overlay') {
  const reactId = useId();
  const owner = `${namespace}-${reactId}`;

  useEffect(() => {
    if (!locked) return;
    acquireBodyScrollLock(owner);
    return () => releaseBodyScrollLock(owner);
  }, [locked, owner]);
}
