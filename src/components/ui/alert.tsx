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
      bg: 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)]/30 text-[var(--text-primary)]',
      icon: <Info className="w-5 h-5 text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-[var(--accent-emerald-bg)] border-[var(--accent-emerald)]/30 text-[var(--text-primary)]',
      icon: <CheckCircle className="w-5 h-5 text-[var(--accent-emerald)] flex-shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-[var(--accent-gold-bg)] border-[var(--accent-gold)]/30 text-[var(--text-primary)]',
      icon: <AlertTriangle className="w-5 h-5 text-[var(--accent-gold)] flex-shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-[var(--accent-crimson-bg)] border-[var(--accent-crimson)]/30 text-[var(--text-primary)]',
      icon: <AlertCircle className="w-5 h-5 text-[var(--accent-crimson)] flex-shrink-0 mt-0.5" />,
    },
  };

  return (
    <div
      className={cn("p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md shadow-sm transition-all animate-in fade-in zoom-in-95 duration-300", configs[variant].bg, className)}
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
