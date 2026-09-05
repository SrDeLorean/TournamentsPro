import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral'
    | 'cyan'
    | 'violet'
    | 'emerald'
    | 'gold'
    | 'rose'
    | 'slate';
  is3D?: boolean;
}

export function Badge({ className, variant = 'primary', is3D = false, children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    primary: "bg-[color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-[var(--app-accent)] border-[var(--app-accent)]/30",
    secondary: "bg-[color-mix(in_srgb,var(--app-accent-2)_16%,transparent)] text-[var(--app-accent-2)] border-[var(--app-accent-2)]/30",
    success: "bg-[color-mix(in_srgb,var(--app-positive)_15%,transparent)] text-[var(--app-positive)] border-[var(--app-positive)]/30",
    warning: "bg-[color-mix(in_srgb,var(--app-warning)_14%,transparent)] text-[var(--app-warning)] border-[var(--app-warning)]/30",
    danger: "bg-[color-mix(in_srgb,var(--app-danger)_16%,transparent)] text-[var(--app-danger)] border-[var(--app-danger)]/30",
    neutral: "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)]",
    // Compatibility aliases
    cyan: "bg-[color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-[var(--app-accent)] border-[var(--app-accent)]/30",
    violet: "bg-[color-mix(in_srgb,var(--app-accent-2)_16%,transparent)] text-[var(--app-accent-2)] border-[var(--app-accent-2)]/30",
    emerald: "bg-[color-mix(in_srgb,var(--app-positive)_15%,transparent)] text-[var(--app-positive)] border-[var(--app-positive)]/30",
    gold: "bg-[color-mix(in_srgb,var(--app-warning)_14%,transparent)] text-[var(--app-warning)] border-[var(--app-warning)]/30",
    rose: "bg-[color-mix(in_srgb,var(--app-danger)_16%,transparent)] text-[var(--app-danger)] border-[var(--app-danger)]/30",
    slate: "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)]",
  };

  const variants3D: Record<string, string> = {
    primary: "badge-3d badge-3d-cyan",
    secondary: "badge-3d badge-3d-violet",
    success: "badge-3d badge-3d-emerald",
    warning: "badge-3d badge-3d-gold",
    danger: "badge-3d badge-3d-crimson",
    neutral: "badge-3d bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)]",
    cyan: "badge-3d badge-3d-cyan",
    violet: "badge-3d badge-3d-violet",
    emerald: "badge-3d badge-3d-emerald",
    gold: "badge-3d badge-3d-gold",
    rose: "badge-3d badge-3d-crimson",
    slate: "badge-3d bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)]",
  };

  return (
    <span
      className={cn(
        is3D
          ? variants3D[variant]
          : cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-[family-name:var(--font-active)] text-[11px] font-bold uppercase tracking-wider border backdrop-blur-sm shadow-sm transition-colors", variants[variant]),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
