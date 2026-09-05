export default function DashboardLoading() {
  return (
    <div className="management-page page-transition" aria-busy="true" aria-label="Cargando panel de gestión">
      <section className="management-hero dashboard-loading-hero">
        <div className="management-hero-grid" aria-hidden="true" />
        <div className="management-hero-main">
          <div className="management-hero-copy">
            <div className="skeleton size-14 rounded-[var(--radius-card)]" />
            <div className="space-y-3">
              <div className="skeleton h-3 w-36 rounded-[var(--radius-pill)]" />
              <div className="skeleton h-9 w-64 max-w-full rounded-[var(--radius-control)]" />
              <div className="skeleton h-4 w-96 max-w-full rounded-[var(--radius-control)]" />
            </div>
          </div>
        </div>
      </section>

      <div className="management-metrics">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-28 rounded-[var(--radius-card)]" />
        ))}
      </div>

      <div className="skeleton h-14 rounded-[var(--radius-card)]" />
      <div className="skeleton h-80 rounded-[var(--radius-card)]" />
      <span className="sr-only">Preparando datos y controles del panel.</span>
      </div>
  );
}
