'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterLabel?: string;
  options?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  brandColor?: string;
  children?: React.ReactNode;
}

export function FilterBar({
  searchPlaceholder = "Buscar club por nombre, tag o capitán...",
  searchValue,
  onSearchChange,
  options = [],
  activeFilter = "TODOS",
  onFilterChange,
  brandColor = 'var(--accent-cyan)',
  children,
}: FilterBarProps) {
  return (
    <div className="p-2 sm:p-2.5 rounded-xl glass-panel border border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
      {/* Streamlined Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: brandColor }}
        />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-9 pr-3 text-xs bg-[var(--bg-card)] border-[var(--border-card)] focus:border-[var(--text-heading)] rounded-lg"
        />
      </div>

      {/* Streamlined Filter Pills Row */}
      {options.length > 0 && onFilterChange && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x flex-shrink-0">
          {options.map((opt) => {
            const isActive = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onFilterChange(opt.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap border"
                style={
                  isActive
                    ? {
                        backgroundColor: brandColor,
                        borderColor: brandColor,
                        color: '#FFFFFF',
                        boxShadow: `0 2px 8px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        color: 'var(--text-muted)',
                      }
                }
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
