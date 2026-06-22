export default function InvestmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-44 bg-[#1a1a1a] rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
            <div className="h-7 w-24 bg-[#1a1a1a] rounded" />
          </div>
        ))}
      </div>
      <div className="h-14 bg-[#ef4444]/5 border border-[#ef4444]/10 rounded-xl" />
      <div className="space-y-3">
        <div className="h-5 w-36 bg-[#1a1a1a] rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-3">
              <div className="h-5 w-32 bg-[#1a1a1a] rounded" />
              <div className="h-3 w-full bg-[#1a1a1a] rounded" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="bg-[#1a1a1a] rounded-lg p-2.5 space-y-1">
                    <div className="h-2.5 w-12 bg-[#222] rounded" />
                    <div className="h-4 w-16 bg-[#222] rounded" />
                  </div>
                ))}
              </div>
              <div className="h-10 bg-[#1a1a1a] rounded-lg" />
              <div className="h-10 bg-[#1a1a1a] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
