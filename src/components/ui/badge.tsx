import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'violet' | 'emerald' | 'gold' | 'rose' | 'slate';
}

export function Badge({ className, variant = 'cyan', children, ...props }: BadgeProps) {
  const variants = {
    cyan: "bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30",
    violet: "bg-[var(--accent-violet-bg)] text-[var(--accent-violet)] border-[var(--accent-violet)]/30",
    emerald: "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30",
    gold: "bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border-[var(--accent-gold)]/30",
    rose: "bg-[var(--accent-crimson-bg)] text-[var(--accent-crimson)] border-[var(--accent-crimson)]/30",
    slate: "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border-card)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.08em] border backdrop-blur-sm shadow-sm transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
