import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">{icon}</div>}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] disabled:opacity-50 shadow-sm",
              icon && "pl-10",
              error && "border-[var(--accent-crimson)] focus:border-[var(--accent-crimson)] focus:ring-[var(--accent-crimson)]",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs font-semibold text-[var(--accent-crimson)]">{error}</span>}
        {helperText && !error && <span className="text-xs text-[var(--text-muted)]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full min-h-[100px] rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] disabled:opacity-50 resize-y shadow-sm",
            error && "border-[var(--accent-crimson)] focus:border-[var(--accent-crimson)] focus:ring-[var(--accent-crimson)]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-semibold text-[var(--accent-crimson)]">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
