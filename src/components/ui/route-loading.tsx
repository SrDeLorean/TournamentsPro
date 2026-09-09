import { cn } from '@/lib/utils';

type RouteLoadingVariant = 'home' | 'directory' | 'auth' | 'dashboard' | 'game';

interface RouteLoadingProps {
  label: string;
  variant?: RouteLoadingVariant;
  cards?: number;
  className?: string;
}

const cardCount: Record<RouteLoadingVariant, number> = {
  home: 8,
  directory: 8,
  auth: 1,
  dashboard: 4,
  game: 6,
};

export function RouteLoading({ label, variant = 'directory', cards, className }: RouteLoadingProps) {
  const amount = cards ?? cardCount[variant];

  return (
    <main
      className={cn('ui-route-state ui-route-loading page-transition', className)}
      data-variant={variant}
      data-ui-state="loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <section className="ui-route-loading-hero" aria-hidden="true">
        <div className="skeleton h-6 w-44 max-w-full rounded-full" />
        <div className="skeleton h-10 w-[32rem] max-w-full rounded-xl" />
        <div className="skeleton h-4 w-[70%] max-w-xl rounded" />
      </section>
      {variant !== 'auth' ? (
        <div className="ui-route-loading-toolbar" aria-hidden="true">
          <div className="skeleton h-10 min-w-0 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
      ) : null}
      <div className="ui-route-loading-grid" aria-hidden="true">
        {Array.from({ length: amount }).map((_, index) => (
          <div key={index} className="skeleton ui-route-loading-card rounded-[var(--radius-card)]" />
        ))}
      </div>
    </main>
  );
}
