export default function TradingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-52 bg-[#1a1a1a] rounded-lg" />
        <div className="h-4 w-80 bg-[#1a1a1a] rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
            <div className="h-1 bg-[#1e1e1e]" />
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-[#1a1a1a] rounded" />
                <div className="h-5 w-32 bg-[#1a1a1a] rounded" />
                <div className="h-3 w-48 bg-[#1a1a1a] rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="bg-[#1a1a1a] rounded-lg p-3 space-y-1.5">
                    <div className="h-2.5 w-12 bg-[#222] rounded" />
                    <div className="h-5 w-14 bg-[#222] rounded" />
                  </div>
                ))}
              </div>
              <div className="h-10 bg-[#1a1a1a] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
