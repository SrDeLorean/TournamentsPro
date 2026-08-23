'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 font-mono">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] p-3 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-[var(--border-card-hover)] resize-y min-h-[80px]",
            error && "border-[var(--accent-crimson)] focus:border-[var(--accent-crimson)] focus:ring-[var(--accent-crimson-bg)]",
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-[11px] font-bold text-[var(--accent-crimson)]">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
