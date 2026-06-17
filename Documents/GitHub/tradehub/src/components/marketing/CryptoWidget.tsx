"use client";

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 80, h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  const fillPts = `0,${h} ${pts} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${up})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const MARKETS = [
  {
    symbol: "BTC", name: "Bitcoin",
    price: "67,234.50", change: "+2.41%", up: true,
    high: "68,120.00", low: "65,800.00", cap: "$1.32T",
    data: [52, 55, 51, 58, 60, 57, 63, 61, 67, 65, 68, 67],
    color: "#f7931a",
  },
  {
    symbol: "ETH", name: "Ethereum",
    price: "3,512.80", change: "+1.83%", up: true,
    high: "3,580.00", low: "3,420.00", cap: "$422B",
    data: [30, 32, 29, 34, 33, 31, 35, 34, 36, 35, 37, 35],
    color: "#627eea",
  },
  {
    symbol: "SOL", name: "Solana",
    price: "142.30", change: "-0.72%", up: false,
    high: "148.50", low: "140.10", cap: "$63B",
    data: [15, 16, 17, 15, 16, 14, 15, 16, 14, 15, 14, 14],
    color: "#9945ff",
  },
  {
    symbol: "BNB", name: "BNB",
    price: "412.50", change: "+3.14%", up: true,
    high: "418.00", low: "398.00", cap: "$60B",
    data: [36, 37, 36, 38, 39, 38, 40, 39, 41, 40, 42, 41],
    color: "#f3ba2f",
  },
];

export default function CryptoWidget() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {MARKETS.map((coin) => (
        <div
          key={coin.symbol}
          className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 hover:border-[#2a2a2a] transition-all hover:-translate-y-0.5 group"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: coin.color + "22", border: `1px solid ${coin.color}33` }}
              >
                <span style={{ color: coin.color }}>{coin.symbol.slice(0, 3)}</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">{coin.symbol}</div>
                <div className="text-[10px] text-[#555]">{coin.name}</div>
              </div>
            </div>
            <Sparkline data={coin.data} up={coin.up} />
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="text-[18px] font-bold text-white">${coin.price}</div>
            <div className={`text-[12px] font-semibold ${coin.up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {coin.change} <span className="text-[#444] font-normal">24h</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1 pt-3 border-t border-[#1a1a1a]">
            <div>
              <div className="text-[9px] text-[#444] uppercase tracking-wider">High</div>
              <div className="text-[10px] text-[#666] font-medium">${coin.high}</div>
            </div>
            <div>
              <div className="text-[9px] text-[#444] uppercase tracking-wider">Low</div>
              <div className="text-[10px] text-[#666] font-medium">${coin.low}</div>
            </div>
            <div>
              <div className="text-[9px] text-[#444] uppercase tracking-wider">MCap</div>
              <div className="text-[10px] text-[#666] font-medium">{coin.cap}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
