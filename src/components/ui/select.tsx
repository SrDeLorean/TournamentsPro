'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
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
      <div className="w-full flex flex-col gap-1.5 font-[family-name:var(--font-active)]">
        {label && (
          <label htmlFor={selectId} className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-[family-name:var(--font-active)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? messageId : undefined}
            className={cn(
              "w-full h-10 pl-3.5 pr-10 rounded-[var(--radius-control)] appearance-none bg-[var(--bg-main)] border border-[var(--border-card)] text-sm font-medium text-[var(--text-primary)] cursor-pointer shadow-sm focus:outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]/25 transition-all font-[family-name:var(--font-active)]",
              icon && "pl-10",
              error && "!border-[var(--app-danger)] focus:!border-[var(--app-danger)] focus:!ring-[var(--app-danger-soft)]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold py-2"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] absolute right-3.5 pointer-events-none transition-colors" />
        </div>
        {error ? (
          <span id={messageId} role="alert" className="text-[11px] font-bold text-[var(--app-danger)]">{error}</span>
        ) : helperText ? (
          <span id={messageId} className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
