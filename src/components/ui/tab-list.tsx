'use client';

import type { HTMLAttributes, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface TabListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  label?: string;
  labelledBy?: string;
}

/** Shared, delegated keyboard and pointer interaction for visual tab lists. */
export function TabList({ label, labelledBy, className, children, onKeyDown, ...props }: TabListProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'),
    );
    if (tabs.length === 0) return;

    const currentIndex = Math.max(0, tabs.indexOf(document.activeElement as HTMLElement));
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;

    event.preventDefault();
    tabs[nextIndex]?.focus({ preventScroll: true });
    tabs[nextIndex]?.click();
  };

  return (
    <div
      {...props}
      role="tablist"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn('ui-fast-tablist', className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
