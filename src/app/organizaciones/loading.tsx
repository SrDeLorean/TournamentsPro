export default function OrganizacionesLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-3">
          <div className="skeleton h-6 w-56 rounded-full" />
          <div className="skeleton h-10 w-80 rounded-xl" />
          <div className="skeleton h-4 w-[50%] rounded" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="skeleton h-10 w-64 rounded-lg" />
          <div className="skeleton h-8 w-28 rounded-full" />
          <div className="skeleton h-8 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
