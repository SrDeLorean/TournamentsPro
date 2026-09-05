import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const navigationButtons = [
  { id: 'first', label: 'Ir a la primera página', Icon: ChevronsLeft },
  { id: 'previous', label: 'Ir a la página anterior', Icon: ChevronLeft },
  { id: 'next', label: 'Ir a la página siguiente', Icon: ChevronRight },
  { id: 'last', label: 'Ir a la última página', Icon: ChevronsRight },
] as const;

export function DataTablePagination({ currentPage, pageSize, totalItems, totalPages, onPageChange }: DataTablePaginationProps) {
  const firstVisible = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(currentPage * pageSize, totalItems);

  const targetPage = (id: (typeof navigationButtons)[number]['id']) => {
    if (id === 'first') return 1;
    if (id === 'previous') return Math.max(1, currentPage - 1);
    if (id === 'next') return Math.min(totalPages, currentPage + 1);
    return totalPages;
  };

  return (
    <div className="ui-data-table-pagination flex flex-col justify-between gap-3 border-t border-[var(--border-card)]/50 p-3 text-sm sm:flex-row sm:items-center sm:p-4">
      <span className="text-[12px] text-[var(--text-muted)] font-medium">
        Mostrando <strong>{firstVisible}</strong> a <strong>{lastVisible}</strong> de <strong>{totalItems}</strong> registros
      </span>
      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start">
        {navigationButtons.map(({ id, label, Icon }, index) => (
          <span key={id} className="contents">
            {index === 2 ? (
              <span className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-main)]/50 px-3 py-1 font-[family-name:var(--font-active)] text-[12px] font-bold text-[var(--text-primary)]">
                {currentPage} / {totalPages}
              </span>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={label}
              disabled={id === 'first' || id === 'previous' ? currentPage === 1 : currentPage === totalPages}
              onClick={() => onPageChange(targetPage(id))}
              className="h-10 w-10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <Icon className="h-4 w-4" />
            </Button>
          </span>
        ))}
      </div>
    </div>
  );
}
