export default function InformacionLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] page-transition">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="skeleton h-4 w-[65%] rounded" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
