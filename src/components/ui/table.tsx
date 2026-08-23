import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-container-theme font-mono">
      <table className={cn("ui-table", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...props}>{children}</thead>;
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-[var(--border-card)]", className)} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-[var(--bg-card-hover)] transition-colors duration-200", className)} {...props}>{children}</tr>;
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3.5 align-middle font-black text-[var(--text-secondary)]", className)} {...props}>{children}</th>;
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle text-[var(--text-primary)]", className)} {...props}>{children}</td>;
}
