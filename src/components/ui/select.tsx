'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, icon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const messageId = `${selectId}-message`;

    return (
      <div className="w-full flex flex-col gap-1.5 font-mono">
        {label && (
          <label htmlFor={selectId} className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? messageId : undefined}
            className={cn(
              "ui-control w-full h-11 px-3 text-xs font-bold cursor-pointer",
              icon && "pl-9",
              error && "border-[var(--accent-crimson)] focus:border-[var(--accent-crimson)] focus:ring-[var(--accent-crimson-bg)]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--ui-surface-solid)] text-[var(--text-primary)] font-semibold py-1">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
        </div>
        {error ? (
          <span id={messageId} role="alert" className="text-[11px] font-bold text-[var(--accent-crimson)]">{error}</span>
        ) : helperText ? (
          <span id={messageId} className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
