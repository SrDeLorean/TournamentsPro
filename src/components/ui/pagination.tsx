'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  brandColor?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  brandColor = 'var(--app-accent)',
  className,
}: PaginationProps) {
  // Generate pagination array (e.g., 1, '...', 4, 5, 6, '...', 10)
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center w-full font-[family-name:var(--font-active)]", className)}>
      <div className="flex items-center gap-1 sm:gap-2 bg-[var(--bg-card)] border border-[var(--border-card)] p-1.5 rounded-[var(--radius-card)] backdrop-blur-md shadow-sm">
        {/* Prev Button */}
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 sm:px-3 sm:py-2 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-sm font-bold font-[family-name:var(--font-active)]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Ant</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-[var(--text-muted)] font-bold">
                  ...
                </span>
              );
            }

            const isCurrent = pageNum === currentPage;

            return (
              <button
                type="button"
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum as number)}
                aria-label={`Ir a la página ${pageNum}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-[var(--radius-control)] text-xs sm:text-sm font-bold transition-all font-[family-name:var(--font-active)]",
                  isCurrent
                    ? "shadow-sm text-[var(--accent-contrast)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]"
                )}
                style={
                  isCurrent
                    ? { backgroundColor: brandColor, boxShadow: `0 2px 10px -2px color-mix(in srgb, ${brandColor} 60%, transparent)` }
                    : {}
                }
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          aria-label="Página siguiente"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 sm:px-3 sm:py-2 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-sm font-bold font-[family-name:var(--font-active)]"
        >
          <span className="hidden sm:inline">Sig</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
