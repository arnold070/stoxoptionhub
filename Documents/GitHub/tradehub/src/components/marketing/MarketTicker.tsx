"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketCoin } from "@/app/api/market/route";

const SYMBOL_ORDER = [
  "BTC", "ETH", "SOL", "BNB", "ADA",
  "AVAX", "DOT", "MATIC", "LINK", "XRP", "DOGE", "LTC",
];

// Fallback static data shown while first fetch is in flight
const FALLBACK: MarketCoin[] = SYMBOL_ORDER.map((sym) => ({
  id: sym.toLowerCase(),
  symbol: sym,
  name: sym,
  price: 0,
  change24h: 0,
  high24h: 0,
  low24h: 0,
  marketCap: 0,
  sparkline: [],
}));

function fmt(price: number): string {
  if (price === 0) return "—";
  if (price >= 10_000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toPrecision(4);
}

function fmtChange(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

const POLL_MS = 60_000;

export default function MarketTicker() {
  const [coins, setCoins] = useState<MarketCoin[]>(FALLBACK);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");
  const prevRef = useRef<Record<string, number>>({});

  async function refresh() {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("not ok");
      const data: MarketCoin[] = await res.json();
      if (!Array.isArray(data)) throw new Error("bad data");

      // Sort by SYMBOL_ORDER; appended unknowns go at the end
      const ordered = [
        ...SYMBOL_ORDER.map((sym) => data.find((c) => c.symbol === sym)).filter(Boolean),
        ...data.filter((c) => !SYMBOL_ORDER.includes(c.symbol)),
      ] as MarketCoin[];

      prevRef.current = Object.fromEntries(coins.map((c) => [c.symbol, c.price]));
      setCoins(ordered);
      setStatus("live");
    } catch {
      setStatus((s) => (s === "loading" ? "error" : s));
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Double for seamless loop
  const items = [...coins, ...coins];

  return (
    <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] border-r border-[#1a1a1a] z-10">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              status === "live"  ? "bg-[#22c55e] animate-pulse" :
              status === "error" ? "bg-[#ef4444]" :
              "bg-[#f0b429] animate-pulse"
            }`}
          />
          <span className="text-[10px] text-[#555] font-semibold uppercase tracking-widest whitespace-nowrap">
            {status === "live" ? "Live Markets" : status === "error" ? "Markets" : "Loading…"}
          </span>
        </div>

        {/* Scrolling track */}
        <div className="overflow-hidden flex-1 min-w-0 relative">
          <div className="animate-ticker flex items-center gap-0">
            {items.map((coin, i) => {
              const up = coin.change24h >= 0;
              return (
                <div
                  key={`${coin.symbol}-${i}`}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-r border-[#1a1a1a]"
                >
                  <span className="text-[11px] font-bold text-white">{coin.symbol}</span>
                  <span className="text-[11px] text-[#666]">
                    {coin.price > 0 ? `$${fmt(coin.price)}` : "—"}
                  </span>
                  {status === "live" && (
                    <span className={`text-[10px] font-semibold ${up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {fmtChange(coin.change24h)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
