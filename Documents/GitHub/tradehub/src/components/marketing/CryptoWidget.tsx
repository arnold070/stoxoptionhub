"use client";

import { useEffect, useState } from "react";
import type { MarketCoin } from "@/app/api/market/route";

const TOP4 = ["BTC", "ETH", "SOL", "BNB"];

const COIN_META: Record<string, {
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  fallbackData: number[];
}> = {
  BTC: { color: "#f7931a", bgClass: "bg-[#f7931a]/10", borderClass: "border-[#f7931a]/20", textClass: "text-[#f7931a]", fallbackData: [52,55,51,58,60,57,63,61,67,65,68,67] },
  ETH: { color: "#627eea", bgClass: "bg-[#627eea]/10", borderClass: "border-[#627eea]/20", textClass: "text-[#627eea]", fallbackData: [30,32,29,34,33,31,35,34,36,35,37,35] },
  SOL: { color: "#9945ff", bgClass: "bg-[#9945ff]/10", borderClass: "border-[#9945ff]/20", textClass: "text-[#9945ff]", fallbackData: [15,16,17,15,16,14,15,16,14,15,14,14] },
  BNB: { color: "#f3ba2f", bgClass: "bg-[#f3ba2f]/10", borderClass: "border-[#f3ba2f]/20", textClass: "text-[#f3ba2f]", fallbackData: [36,37,36,38,39,38,40,39,41,40,42,41] },
};

function Sparkline({ data, up, color }: { data: number[]; up: boolean; color: string }) {
  if (data.length < 2) return <div className="w-20 h-8" />;
  const w = 80, h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  const lineColor = up ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function fmtPrice(price: number): string {
  if (price === 0) return "—";
  if (price >= 10_000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toPrecision(4);
}

function fmtCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return cap > 0 ? `$${cap.toFixed(0)}` : "—";
}

const POLL_MS = 60_000;

export default function CryptoWidget() {
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [live, setLive] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("not ok");
      const data: MarketCoin[] = await res.json();
      if (!Array.isArray(data)) throw new Error("bad data");
      const top = TOP4.map((sym) => data.find((c) => c.symbol === sym)).filter(Boolean) as MarketCoin[];
      setCoins(top);
      setLive(true);
    } catch {
      // keep existing state
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayed = coins.length > 0
    ? coins
    : TOP4.map((sym) => ({
        id: sym.toLowerCase(), symbol: sym, name: sym,
        price: 0, change24h: 0, high24h: 0, low24h: 0,
        marketCap: 0, sparkline: COIN_META[sym].fallbackData,
      } as MarketCoin));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayed.map((coin) => {
        const meta = COIN_META[coin.symbol] ?? { color: "#888", fallbackData: [] };
        const up = coin.change24h >= 0;
        const sparkData = coin.sparkline.length >= 2 ? coin.sparkline : meta.fallbackData;

        return (
          <div
            key={coin.symbol}
            className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 hover:border-[#2a2a2a] transition-all hover:-translate-y-0.5 group"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${meta.bgClass} ${meta.borderClass}`}>
                  <span className={meta.textClass}>{coin.symbol.slice(0, 3)}</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">{coin.symbol}</div>
                  <div className="text-[10px] text-[#555]">{coin.name}</div>
                </div>
              </div>
              <Sparkline data={sparkData} up={up} color={meta.color} />
            </div>

            {/* Price */}
            <div className="mb-2">
              <div className="text-[18px] font-bold text-white">
                {coin.price > 0 ? `$${fmtPrice(coin.price)}` : <span className="text-[#333]">Loading…</span>}
              </div>
              {live && (
                <div className={`text-[12px] font-semibold ${up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {(coin.change24h >= 0 ? "+" : "") + coin.change24h.toFixed(2)}%{" "}
                  <span className="text-[#444] font-normal">24h</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-[#1a1a1a]">
              <div>
                <div className="text-[9px] text-[#444] uppercase tracking-wider">High</div>
                <div className="text-[10px] text-[#666] font-medium">
                  {coin.high24h > 0 ? `$${fmtPrice(coin.high24h)}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#444] uppercase tracking-wider">Low</div>
                <div className="text-[10px] text-[#666] font-medium">
                  {coin.low24h > 0 ? `$${fmtPrice(coin.low24h)}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#444] uppercase tracking-wider">MCap</div>
                <div className="text-[10px] text-[#666] font-medium">{fmtCap(coin.marketCap)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
