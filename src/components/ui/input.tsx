import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && <div className="absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none">{icon}</div>}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-card)] px-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--accent-cyan)]/50 focus-visible:border-[var(--accent-cyan)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-[var(--border-card-hover)]",
              icon && "pl-9",
              error && "border-[var(--accent-crimson)] focus-visible:border-[var(--accent-crimson)] focus-visible:ring-[var(--accent-crimson)]/50 hover:border-[var(--accent-crimson)]",
              className
            )}
            {...props}
          />
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <motion.span 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }} 
              className="text-[12px] font-medium text-[var(--accent-crimson)]"
            >
              {error}
            </motion.span>
          ) : helperText ? (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="text-[12px] text-[var(--text-muted)]"
            >
              {helperText}
            </motion.span>
          ) : null}
        </AnimatePresence>
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
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full min-h-[100px] rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-card)] p-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--accent-cyan)]/50 focus-visible:border-[var(--accent-cyan)] disabled:opacity-50 disabled:cursor-not-allowed resize-y shadow-sm hover:border-[var(--border-card-hover)]",
            error && "border-[var(--accent-crimson)] focus-visible:border-[var(--accent-crimson)] focus-visible:ring-[var(--accent-crimson)]/50 hover:border-[var(--accent-crimson)]",
            className
          )}
          {...props}
        />
        <AnimatePresence mode="wait">
          {error ? (
            <motion.span 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }} 
              className="text-[12px] font-medium text-[var(--accent-crimson)]"
            >
              {error}
            </motion.span>
          ) : helperText ? (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="text-[12px] text-[var(--text-muted)]"
            >
              {helperText}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
