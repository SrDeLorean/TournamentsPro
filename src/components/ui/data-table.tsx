'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchField?: keyof T | ((row: T) => string);
  filterOptions?: FilterOption[];
  defaultPageSize?: number;
  brandColor?: string;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchPlaceholder = 'Buscar registros...',
  searchField,
  filterOptions = [],
  defaultPageSize = 10,
  brandColor = '#00F0FF',
  emptyMessage = 'No se encontraron registros en la tabla.',
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search term filter
      if (searchTerm) {
        let matches = false;
        if (typeof searchField === 'function') {
          matches = searchField(row).toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchField && row[searchField]) {
          matches = String(row[searchField]).toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          matches = Object.values(row).some((val) =>
            String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (!matches) return false;
      }

      // Additional dropdown filters
      for (const [key, val] of Object.entries(activeFilters)) {
        if (val && val !== 'ALL' && String(row[key as keyof T] || '').toLowerCase() !== val.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, activeFilters, searchField]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const rawA = a[sortColumn];
      const rawB = b[sortColumn];
      const valA = typeof rawA === 'number' ? rawA : String(rawA ?? '');
      const valB = typeof rawB === 'number' ? rawB : String(rawB ?? '');
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (colKey?: keyof T) => {
    if (!colKey) return;
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortColumn(null);
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Advanced Dropdown Filters Toolbar */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-card)] space-y-3 shadow-sm transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--bg-main)]/50 border border-transparent focus:border-[var(--border-card-hover)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all"
            />
          </div>

          {/* Dynamic Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterOptions.map((f) => (
              <div key={f.key} className="flex items-center gap-1.5">
                <select
                  value={activeFilters[f.key] || 'ALL'}
                  onChange={(e) => {
                    setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-3 rounded-lg bg-[var(--bg-main)]/50 border border-transparent focus:border-[var(--border-card-hover)] text-[12px] font-semibold text-[var(--text-secondary)] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0b101b] text-slate-100">
                    {f.label}: Todos
                  </option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0b101b] text-slate-100">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Filas:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg bg-[var(--bg-main)]/50 border border-transparent focus:border-[var(--border-card-hover)] text-[12px] font-bold text-[var(--accent-cyan)] focus:outline-none transition-all cursor-pointer"
              >
                <option value={5} className="bg-[#0b101b] text-slate-100">5</option>
                <option value={10} className="bg-[#0b101b] text-slate-100">10</option>
                <option value={20} className="bg-[#0b101b] text-slate-100">20</option>
                <option value={50} className="bg-[#0b101b] text-slate-100">50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Table Container */}
      <div
        className="table-container-theme font-mono"
        style={{ borderColor: `color-mix(in srgb, ${brandColor} 30%, var(--border-card))` }}
      >
        <div className="overflow-x-auto">
          <table className="ui-table">
            <thead>
              <tr className="border-b border-[var(--border-card)]">
                {columns.map((col, idx) => {
                  const isSorted = sortColumn === col.accessorKey;
                  return (
                    <th
                      key={idx}
                      onClick={() => col.sortable && handleSort(col.accessorKey)}
                      className={`px-4 py-3 align-middle ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors' : ''} ${col.className || ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-[var(--text-muted)]">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3 h-3 text-[var(--accent-cyan)]" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-[var(--accent-cyan)]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-50 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-card)]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center text-[var(--text-muted)] text-sm italic">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-card-hover)] transition-colors duration-200">
                    {columns.map((col, idx) => (
                      <td key={idx} className={`px-4 py-3 align-middle ${col.className || ''}`}>
                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] || '') : null}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3 align-middle text-right space-x-1.5">{actions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[var(--border-card)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <span className="text-[12px] text-[var(--text-muted)] font-medium">
            Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> a{' '}
            <strong>{Math.min(currentPage * pageSize, sortedData.length)}</strong> de{' '}
            <strong>{sortedData.length}</strong> registros
          </span>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 py-1 font-mono text-[12px] text-[var(--text-primary)] font-bold bg-[var(--bg-main)]/50 rounded-lg border border-[var(--border-card)]">
              {currentPage} / {totalPages}
            </span>

            <Button
              size="icon"
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
