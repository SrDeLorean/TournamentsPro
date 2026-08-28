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
  X,
  RotateCcw,
  Inbox,
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
  ariaLabel?: string;
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
  ariaLabel = 'Listado de gestión',
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
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const hasActiveControls = Boolean(searchTerm) || Object.values(activeFilters).some((value) => value && value !== 'ALL');
  const resetControls = () => {
    setSearchTerm('');
    setActiveFilters({});
    setCurrentPage(1);
  };

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
    <div className="ui-data-table min-w-0 space-y-3">
      {/* Search & Advanced Dropdown Filters Toolbar */}
      <div className="ui-data-table-toolbar p-3 sm:p-4 rounded-xl bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-card)] space-y-3 shadow-sm transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--text-primary)] transition-colors" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={searchPlaceholder}
              className="ui-control w-full h-10 pl-9 pr-10 text-[13px]"
            />
            {searchTerm && (
              <button type="button" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Dropdown Filters */}
          <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
            {filterOptions.map((f) => (
              <div key={f.key} className="flex min-w-0 flex-1 sm:flex-none items-center gap-1.5">
                <select
                  value={activeFilters[f.key] || 'ALL'}
                  onChange={(e) => {
                    setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                    setCurrentPage(1);
                  }}
                  aria-label={`Filtrar por ${f.label}`}
                  className="ui-control min-w-0 max-w-full flex-1 h-9 px-3 text-[12px] font-semibold cursor-pointer"
                >
                  <option value="ALL" className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                    {f.label}: Todos
                  </option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
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
                aria-label="Filas por página"
                className="ui-control h-9 px-2 text-[12px] font-bold text-[var(--accent-cyan)] cursor-pointer"
              >
                <option value={5} className="bg-[var(--bg-card)] text-[var(--text-primary)]">5</option>
                <option value={10} className="bg-[var(--bg-card)] text-[var(--text-primary)]">10</option>
                <option value={20} className="bg-[var(--bg-card)] text-[var(--text-primary)]">20</option>
                <option value={50} className="bg-[var(--bg-card)] text-[var(--text-primary)]">50</option>
              </select>
            </div>
            {hasActiveControls && (
              <Button type="button" size="sm" variant="ghost" onClick={resetControls} className="h-9 gap-1.5 text-xs text-[var(--text-secondary)]">
                <RotateCcw className="size-3.5" /> Restablecer
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-card)] pt-3 text-[11px] text-[var(--text-muted)]">
          <span><strong className="text-[var(--text-heading)]">{sortedData.length}</strong> de {data.length} registros</span>
          {hasActiveControls && <span className="rounded-full bg-[var(--accent-cyan-bg)] px-2.5 py-1 font-mono font-bold text-[var(--accent-cyan)]">Filtros activos</span>}
        </div>
      </div>

      {/* Standardized Table Container */}
      <div
        className="ui-data-table-shell table-container-theme font-mono"
        style={{ borderColor: `color-mix(in srgb, ${brandColor} 30%, var(--border-card))` }}
      >
        <div className="mobile-scroll-row overflow-x-auto" role="region" aria-label={ariaLabel} tabIndex={0}>
          <table className="ui-table ui-data-table-responsive">
            <thead>
              <tr className="border-b border-[var(--border-card)]">
                {columns.map((col, idx) => {
                  const isSorted = sortColumn === col.accessorKey;
                  return (
                    <th
                      key={idx}
                      aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={`px-4 py-3 align-middle ${col.className || ''}`}
                    >
                      <button type="button" disabled={!col.sortable} onClick={() => handleSort(col.accessorKey)} className="flex w-full items-center gap-1.5 text-left disabled:cursor-default">
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
                      </button>
                    </th>
                  );
                })}
                {actions && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-card)]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td data-empty="true" colSpan={columns.length + (actions ? 1 : 0)} className="p-10 text-center text-[var(--text-muted)] text-sm">
                    <Inbox className="mx-auto mb-3 size-8 opacity-60" />
                    <p className="font-bold not-italic text-[var(--text-heading)]">Sin resultados</p>
                    <p className="mt-1 text-xs not-italic">{emptyMessage}</p>
                    {hasActiveControls && <Button type="button" size="sm" variant="ghost" onClick={resetControls} className="mt-3">Limpiar filtros</Button>}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-card-hover)] transition-colors duration-200">
                    {columns.map((col, idx) => (
                      <td key={idx} data-label={col.header} className={`px-4 py-3 align-middle ${col.className || ''}`}>
                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] || '') : null}
                      </td>
                    ))}
                    {actions && <td data-label="Acciones" className="px-4 py-3 align-middle text-right space-x-1.5">{actions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[var(--border-card)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <span className="text-[12px] text-[var(--text-muted)] font-medium">
            Mostrando <strong>{sortedData.length ? (safeCurrentPage - 1) * pageSize + 1 : 0}</strong> a{' '}
            <strong>{Math.min(safeCurrentPage * pageSize, sortedData.length)}</strong> de{' '}
            <strong>{sortedData.length}</strong> registros
          </span>

          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 py-1 font-mono text-[12px] text-[var(--text-primary)] font-bold bg-[var(--bg-main)]/50 rounded-lg border border-[var(--border-card)]">
              {safeCurrentPage} / {totalPages}
            </span>

            <Button
              size="icon"
              variant="ghost"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={safeCurrentPage === totalPages}
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
