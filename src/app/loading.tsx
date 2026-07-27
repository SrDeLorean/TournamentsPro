export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] page-transition">
      {/* Hero skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 space-y-8">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="skeleton h-7 w-64 rounded-full" />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-12 w-[80%] max-w-2xl rounded-xl" />
          <div className="skeleton h-12 w-[60%] max-w-xl rounded-xl" />
        </div>

        {/* Description */}
        <div className="flex flex-col items-center gap-2">
          <div className="skeleton h-4 w-[70%] max-w-lg rounded" />
          <div className="skeleton h-4 w-[50%] max-w-md rounded" />
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
