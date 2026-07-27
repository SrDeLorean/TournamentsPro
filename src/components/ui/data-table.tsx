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
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    return data.filter((row: any) => {
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
        if (val && val !== 'ALL' && String(row[key] || '').toLowerCase() !== val.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, activeFilters, searchField]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const valA = a[sortColumn] || '';
      const valB = b[sortColumn] || '';
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
      <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-medium"
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
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">{f.label}: Todos</option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Filas:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-cyan-400 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Table Container */}
      <div
        className="rounded-2xl border bg-slate-950 overflow-hidden shadow-2xl transition-all"
        style={{ borderColor: `color-mix(in srgb, ${brandColor} 30%, transparent)` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                {columns.map((col, idx) => {
                  const isSorted = sortColumn === col.accessorKey;
                  return (
                    <th
                      key={idx}
                      onClick={() => col.sortable && handleSort(col.accessorKey)}
                      className={`p-4 ${col.sortable ? 'cursor-pointer select-none hover:text-white' : ''} ${col.className || ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-500">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3 h-3 text-cyan-400" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-cyan-400" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions && <th className="p-4 text-right">Acciones</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center text-slate-400 text-xs italic">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                    {columns.map((col, idx) => (
                      <td key={idx} className={`p-4 ${col.className || ''}`}>
                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] || '') : null}
                      </td>
                    ))}
                    {actions && <td className="p-4 text-right space-x-1.5">{actions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> a{' '}
            <strong>{Math.min(currentPage * pageSize, sortedData.length)}</strong> de{' '}
            <strong>{sortedData.length}</strong> registros
          </span>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 py-1 font-mono text-xs text-cyan-400 font-bold bg-slate-950 rounded-lg border border-cyan-500/30">
              {currentPage} / {totalPages}
            </span>

            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
