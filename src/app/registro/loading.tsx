export default function RegistroLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center page-transition">
      <div className="w-full max-w-lg mx-auto px-4 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-12 w-12 rounded-xl" />
          <div className="skeleton h-6 w-48 rounded-lg" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>

        {/* Form card */}
        <div className="glass-panel rounded-2xl p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
