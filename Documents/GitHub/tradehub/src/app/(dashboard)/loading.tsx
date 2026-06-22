export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 space-y-3">
            <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
            <div className="h-7 w-28 bg-[#1a1a1a] rounded" />
            <div className="h-3 w-16 bg-[#1a1a1a] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
        <div className="h-5 w-36 bg-[#1a1a1a] rounded" />
        <div className="h-24 bg-[#1a1a1a] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 space-y-3">
            <div className="h-5 w-32 bg-[#1a1a1a] rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 bg-[#1a1a1a] rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
