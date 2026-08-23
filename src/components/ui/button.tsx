'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variants = {
      primary: "bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/90 text-[#05070d] font-bold shadow-[0_4px_14px_0_rgba(34,211,238,0.25)] hover:shadow-[0_6px_20px_rgba(34,211,238,0.23)] border border-cyan-400/30",
      secondary: "bg-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/90 text-white font-bold shadow-[0_4px_14px_0_rgba(168,85,247,0.25)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)] border border-purple-400/30",
      outline: "border border-[var(--border-card)] bg-transparent hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] shadow-sm",
      danger: "bg-[var(--accent-crimson)] hover:bg-[var(--accent-crimson)]/90 text-white font-bold shadow-[0_4px_14px_0_rgba(225,29,72,0.25)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)]",
      ghost: "hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      glass: "bg-[var(--bg-card)]/50 backdrop-blur-md border border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 shrink-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
