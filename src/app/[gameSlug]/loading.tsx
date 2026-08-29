export default function GamePortalLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] page-transition" role="status" aria-label="Cargando portal del juego">
      <div className="max-w-[96rem] mx-auto px-3 sm:px-6 py-5 space-y-5 pb-20">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
          <div className="skeleton h-6 w-40 max-w-full rounded-full" />
          <div className="skeleton h-9 w-[32rem] max-w-full rounded-xl" />
          <div className="skeleton h-4 w-[70%] max-w-full rounded" />
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 space-y-3 shadow-[var(--shadow-soft)]">
          <div className="skeleton h-11 w-full rounded-xl" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-24 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl border border-[var(--border-card)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
