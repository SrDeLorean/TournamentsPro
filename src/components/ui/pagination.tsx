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
  brandColor = 'var(--accent-cyan)',
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
    <div className={cn("flex items-center justify-center w-full", className)}>
      <div className="flex items-center gap-1 sm:gap-2 bg-[var(--bg-card)]/50 border border-[var(--border-card)] p-1.5 rounded-2xl backdrop-blur-md shadow-sm">
        {/* Prev Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-sm font-bold"
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
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum as number)}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all",
                  isCurrent
                    ? "shadow-sm text-black"
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
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-sm font-bold"
        >
          <span className="hidden sm:inline">Sig</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
