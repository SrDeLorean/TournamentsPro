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
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
            className={cn(
              "w-full h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] px-3 text-xs font-bold text-[var(--text-primary)] transition-all duration-200 focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-[var(--border-card-hover)] cursor-pointer",
              icon && "pl-9",
              error && "border-[var(--accent-crimson)] focus:border-[var(--accent-crimson)] focus:ring-[var(--accent-crimson-bg)]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0b101b] text-slate-100 font-semibold py-1">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
        </div>
        {error ? (
          <span className="text-[11px] font-bold text-[var(--accent-crimson)]">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
