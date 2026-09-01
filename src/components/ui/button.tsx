'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'ghost'
    | 'glass'
    | '3d-cyan'
    | '3d-violet'
    | '3d-emerald'
    | '3d-gold'
    | '3d-crimson'
    | '3d-glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
      primary: "ui-button ui-button-primary font-bold",
      secondary: "ui-button ui-button-secondary font-bold",
      outline: "ui-button ui-button-outline",
      danger: "ui-button ui-button-danger font-bold",
      ghost: "ui-button ui-button-ghost",
      glass: "ui-button ui-button-glass",
      '3d-cyan': "btn-3d btn-3d-cyan",
      '3d-violet': "btn-3d btn-3d-violet",
      '3d-emerald': "btn-3d btn-3d-emerald",
      '3d-gold': "btn-3d btn-3d-gold",
      '3d-crimson': "btn-3d btn-3d-crimson",
      '3d-glass': "btn-3d btn-3d-glass",
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
        aria-busy={isLoading || undefined}
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
