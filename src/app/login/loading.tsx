export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center page-transition">
      <div className="w-full max-w-md mx-auto px-4 space-y-6">
        {/* Logo area */}
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-12 w-12 rounded-xl" />
          <div className="skeleton h-6 w-40 rounded-lg" />
        </div>

        {/* Form card */}
        <div className="glass-panel rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="flex items-center gap-3">
            <div className="skeleton h-px flex-1" />
            <div className="skeleton h-4 w-8 rounded" />
            <div className="skeleton h-px flex-1" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
