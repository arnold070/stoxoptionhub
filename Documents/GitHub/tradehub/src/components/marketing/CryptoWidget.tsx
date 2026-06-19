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
  BTC: { color: "#f7931a", bgClass: "bg-[#f7931a]/10", borderClass: "border-[#f7931a]/20", textClass: "text-[#f7931a]", fallbackData: [52,55,51,58,60,57,63,61,67,65,68,67,66,67] },
  ETH: { color: "#627eea", bgClass: "bg-[#627eea]/10", borderClass: "border-[#627eea]/20", textClass: "text-[#627eea]", fallbackData: [30,32,29,34,33,31,35,34,36,35,37,35,36,35] },
  SOL: { color: "#9945ff", bgClass: "bg-[#9945ff]/10", borderClass: "border-[#9945ff]/20", textClass: "text-[#9945ff]", fallbackData: [15,16,17,15,16,14,15,16,14,15,14,14,14,15] },
  BNB: { color: "#f3ba2f", bgClass: "bg-[#f3ba2f]/10", borderClass: "border-[#f3ba2f]/20", textClass: "text-[#f3ba2f]", fallbackData: [36,37,36,38,39,38,40,39,41,40,42,41,41,42] },
};

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <div className="w-20 h-8" />;
  const w = 80, h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 4) - 2}`)
    .join(" ");
  const fill = `0,${h} ${pts} ${w},${h}`;
  const lineColor = up ? "#22c55e" : "#ef4444";
  const gradId = `sg-${up ? "up" : "dn"}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function fmtPrice(p: number): string {
  if (!p) return "—";
  if (p >= 10_000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return p.toPrecision(4);
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return v > 0 ? `$${v.toFixed(0)}` : "—";
}

const POLL_MS = 30_000;

export default function CryptoWidget() {
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [live, setLive] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error();
      const data: MarketCoin[] = await res.json();
      if (!Array.isArray(data)) throw new Error();
      const top = TOP4.map((sym) => data.find((c) => c.symbol === sym)).filter(Boolean) as MarketCoin[];
      setCoins(top);
      setLive(true);
    } catch {
      // keep last state
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayed: MarketCoin[] = coins.length > 0
    ? coins
    : TOP4.map((sym) => ({
        id: sym.toLowerCase(), symbol: sym, name: sym,
        price: 0, change24h: 0, high24h: 0, low24h: 0,
        volume24h: 0, sparkline: COIN_META[sym]?.fallbackData ?? [],
      }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayed.map((coin) => {
        const meta = COIN_META[coin.symbol] ?? {
          color: "#888", bgClass: "bg-[#888]/10", borderClass: "border-[#888]/20",
          textClass: "text-[#888]", fallbackData: [],
        };
        const up = coin.change24h >= 0;
        const sparkData = coin.sparkline.length >= 2 ? coin.sparkline : meta.fallbackData;

        return (
          <div
            key={coin.symbol}
            className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 hover:border-[#2a2a2a] transition-all hover:-translate-y-0.5"
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
              <Sparkline data={sparkData} up={up} />
            </div>

            {/* Price */}
            <div className="mb-2">
              <div className="text-[18px] font-bold text-white font-mono">
                {coin.price > 0 ? `$${fmtPrice(coin.price)}` : <span className="text-[#2a2a2a]">Loading…</span>}
              </div>
              {live && (
                <div className={`text-[12px] font-semibold ${up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {(up ? "+" : "") + coin.change24h.toFixed(2)}%{" "}
                  <span className="text-[#444] font-normal">24h</span>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-[#1a1a1a]">
              <div>
                <div className="text-[9px] text-[#444] uppercase tracking-wider">High</div>
                <div className="text-[10px] text-[#666] font-medium font-mono">
                  {coin.high24h > 0 ? `$${fmtPrice(coin.high24h)}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#444] uppercase tracking-wider">Low</div>
                <div className="text-[10px] text-[#666] font-medium font-mono">
                  {coin.low24h > 0 ? `$${fmtPrice(coin.low24h)}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#444] uppercase tracking-wider">Vol 24h</div>
                <div className="text-[10px] text-[#666] font-medium">{fmtVol(coin.volume24h)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
