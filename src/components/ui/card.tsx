import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ui-card relative overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display font-bold text-lg leading-tight tracking-tight text-[var(--text-heading)]", className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-[var(--text-muted)]", className)} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6 pt-0 text-[var(--text-primary)]", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-5 sm:p-6 pt-4 mt-auto border-t border-[var(--border-card)]", className)} {...props}>{children}</div>;
}
