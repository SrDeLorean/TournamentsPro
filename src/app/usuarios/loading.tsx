export default function UsuariosLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-3">
          <div className="skeleton h-6 w-48 rounded-full" />
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="skeleton h-4 w-[55%] rounded" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="skeleton h-10 w-64 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* User cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
