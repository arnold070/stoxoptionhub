export default function MembershipsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
            <div className="h-6 w-36 bg-[#1a1a1a] rounded" />
            <div className="h-3 w-full bg-[#1a1a1a] rounded" />
            <div className="h-10 w-28 bg-[#1a1a1a] rounded" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3 w-full bg-[#1a1a1a] rounded" />
              ))}
            </div>
            <div className="h-10 bg-[#1a1a1a] rounded-lg mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
