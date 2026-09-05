import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className, ...props }: AlertProps) {
  const configs = {
    info: {
      bg: 'bg-[color-mix(in_srgb,var(--app-accent)_12%,transparent)] border-[var(--app-accent)]/30 text-[var(--text-primary)]',
      icon: <Info className="w-5 h-5 text-[var(--app-accent)] flex-shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-[color-mix(in_srgb,var(--app-positive)_14%,transparent)] border-[var(--app-positive)]/30 text-[var(--text-primary)]',
      icon: <CheckCircle className="w-5 h-5 text-[var(--app-positive)] flex-shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-[color-mix(in_srgb,var(--app-warning)_14%,transparent)] border-[var(--app-warning)]/30 text-[var(--text-primary)]',
      icon: <AlertTriangle className="w-5 h-5 text-[var(--app-warning)] flex-shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-[color-mix(in_srgb,var(--app-danger)_14%,transparent)] border-[var(--app-danger)]/30 text-[var(--text-primary)]',
      icon: <AlertCircle className="w-5 h-5 text-[var(--app-danger)] flex-shrink-0 mt-0.5" />,
    },
  };

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
      className={cn("ui-alert relative overflow-hidden p-4 rounded-[var(--radius-card)] border flex items-start gap-3 backdrop-blur-md shadow-sm transition-all animate-in fade-in zoom-in-95 duration-300 font-[family-name:var(--font-active)]", configs[variant].bg, className)}
      {...props}
    >
      {configs[variant].icon}
      <div className="flex flex-col gap-1 text-[13px]">
        {title && <span className="font-semibold text-sm leading-tight text-[var(--text-heading)]">{title}</span>}
        <div className="leading-relaxed text-[var(--text-secondary)]">{children}</div>
      </div>
    </div>
  );
}
