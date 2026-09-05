'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

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
  brandColor = 'var(--app-accent)',
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
    <div
      className="ui-data-table min-w-0 space-y-3"
      style={{ '--data-table-accent': brandColor } as React.CSSProperties}
    >
      {/* Search & Advanced Dropdown Filters Toolbar */}
      <div className="ui-data-table-toolbar space-y-3">
        <div className="flex min-w-0 flex-col justify-between gap-3 xl:flex-row xl:items-center">
          {/* Search Bar */}
          <div className="ui-data-table-search group relative w-full min-w-0 xl:max-w-xl xl:flex-1">
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
          <div className="ui-data-table-filters grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-none xl:auto-cols-max xl:grid-flow-col xl:items-center">
            {filterOptions.map((f) => (
              <div key={f.key} className="relative flex min-w-0 items-center">
                <select
                  value={activeFilters[f.key] || 'ALL'}
                  onChange={(e) => {
                    setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                    setCurrentPage(1);
                  }}
                  aria-label={`Filtrar por ${f.label}`}
                  className="w-full xl:w-auto min-w-[140px] h-10 pl-3 pr-8 rounded-xl appearance-none bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[12px] font-bold text-[var(--text-primary)] cursor-pointer shadow-sm focus:outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent-soft)] transition-all"
                >
                  <option value="ALL" className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold">
                    {f.label}: Todos
                  </option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 pointer-events-none" />
              </div>
            ))}

            {/* Page Size Selector */}
            <div className="relative flex min-w-0 items-center">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Filas por página"
                className="w-full xl:w-auto min-w-[100px] h-10 pl-3 pr-8 rounded-xl appearance-none bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[12px] font-bold text-[var(--text-primary)] cursor-pointer shadow-sm focus:outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent-soft)] transition-all"
              >
                <option value={5} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold">5 filas</option>
                <option value={10} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold">10 filas</option>
                <option value={20} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold">20 filas</option>
                <option value={50} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold">50 filas</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 pointer-events-none" />
            </div>
            {hasActiveControls && (
              <Button type="button" size="sm" variant="ghost" onClick={resetControls} className="h-10 w-full gap-1.5 text-xs text-[var(--text-secondary)] xl:w-auto">
                <RotateCcw className="size-3.5" /> Restablecer
              </Button>
            )}
          </div>
        </div>
        <div className="ui-data-table-summary flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-card)] pt-3 text-[11px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">
          <span><strong className="text-[var(--text-heading)]">{sortedData.length}</strong> de {data.length} registros disponibles</span>
          {hasActiveControls && <span className="rounded-full bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] px-2.5 py-1 font-[family-name:var(--font-active)] font-bold text-[var(--app-accent)]">Filtros activos</span>}
        </div>
      </div>

      {/* Standardized Table Container */}
      <div
        className="ui-data-table-shell table-container-theme font-[family-name:var(--font-active)]"
      >
        <div className="ui-data-table-heading" aria-hidden="true">
          <span>Directorio</span>
          <span>{sortedData.length} registros</span>
        </div>
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
                                <ArrowUp className="w-3 h-3 text-[var(--app-accent)]" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-[var(--app-accent)]" />
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
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className="transition-colors duration-200"
                    data-row-number={(safeCurrentPage - 1) * pageSize + rowIndex + 1}
                  >
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

        <DataTablePagination
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={sortedData.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
