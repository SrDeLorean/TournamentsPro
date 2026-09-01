import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  is3D?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, icon, is3D = false, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && <div className="absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none">{icon}</div>}
          <input
            id={inputId}
            type={type}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? messageId : undefined}
            className={cn(
              is3D ? "input-3d px-3 text-[14px]" : "ui-control w-full h-10 px-3 text-[14px] placeholder:text-[var(--text-muted)]",
              icon && "pl-9",
              error && "!border-[var(--accent-crimson)] focus:!shadow-[0_0_0_3px_var(--accent-crimson-bg)]",
              className
            )}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <span id={messageId} role={error ? 'alert' : undefined} className={cn("animate-fade-up text-[12px]", error ? "font-medium text-[var(--accent-crimson)]" : "text-[var(--text-muted)]")}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error || helperText ? messageId : undefined}
          className={cn(
            "ui-control w-full min-h-[100px] p-3 text-[14px] placeholder:text-[var(--text-muted)] resize-y",
            error && "!border-[var(--accent-crimson)] focus:!shadow-[0_0_0_3px_var(--accent-crimson-bg)]",
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <span id={messageId} role={error ? 'alert' : undefined} className={cn("animate-fade-up text-[12px]", error ? "font-medium text-[var(--accent-crimson)]" : "text-[var(--text-muted)]")}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
