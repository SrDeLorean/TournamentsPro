export default function GamePortalLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] page-transition">
      {/* Sub-navbar skeleton */}
      <div className="w-full h-11 border-b border-[var(--border-card)] bg-[var(--bg-nav)]">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-20 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Banner area */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <div className="skeleton w-full h-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-main)]" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 space-y-6 pb-20">
        {/* Section header */}
        <div className="space-y-3">
          <div className="skeleton h-6 w-48 rounded-full" />
          <div className="skeleton h-10 w-96 rounded-xl" />
          <div className="skeleton h-4 w-[70%] rounded" />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-64 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
