"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketCoin } from "@/app/api/market/route";

// ── Binance combined mini-ticker WebSocket on port 443 (firewall-safe) ────────
const WS_SYMS = [
  "btcusdt", "ethusdt", "solusdt", "bnbusdt", "adausdt",
  "avaxusdt", "dotusdt", "maticusdt", "linkusdt", "xrpusdt",
  "dogeusdt", "ltcusdt",
];
const WS_URL =
  "wss://stream.binance.com:443/stream?streams=" +
  WS_SYMS.map((s) => `${s}@miniTicker`).join("/");

// Map Binance symbol → display symbol
const ASSET_TO_SYM: Record<string, string> = {
  BTCUSDT: "BTC", ETHUSDT: "ETH", SOLUSDT: "SOL", BNBUSDT: "BNB",
  ADAUSDT: "ADA", AVAXUSDT: "AVAX", DOTUSDT: "DOT", MATICUSDT: "MATIC",
  LINKUSDT: "LINK", XRPUSDT: "XRP", DOGEUSDT: "DOGE", LTCUSDT: "LTC",
};

const DISPLAY_ORDER = [
  "BTC", "ETH", "SOL", "BNB", "ADA", "AVAX",
  "DOT", "MATIC", "LINK", "XRP", "DOGE", "LTC",
];

type CoinState = { symbol: string; price: number; change24h: number };

function mkDefault(): CoinState[] {
  return DISPLAY_ORDER.map((s) => ({ symbol: s, price: 0, change24h: 0 }));
}

function fmt(p: number) {
  if (!p) return "—";
  if (p >= 10_000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return p.toPrecision(4);
}

export default function MarketTicker() {
  const [coins, setCoins] = useState<CoinState[]>(mkDefault);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const retryMs = useRef(1_000);
  const alive = useRef(true);
  const prevPrices = useRef<Record<string, number>>({});
  const [flashing, setFlashing] = useState<Record<string, "up" | "dn">>({});

  // ── Seed from REST on first load ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/market")
      .then((r) => (r.ok ? (r.json() as Promise<MarketCoin[]>) : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        setCoins(
          DISPLAY_ORDER.map((sym) => {
            const d = data.find((c) => c.symbol === sym);
            if (d?.price) prevPrices.current[sym] = d.price;
            return { symbol: sym, price: d?.price ?? 0, change24h: d?.change24h ?? 0 };
          })
        );
      })
      .catch(() => {});
  }, []);

  // ── CoinCap WebSocket for live streaming ─────────────────────────────────
  useEffect(() => {
    alive.current = true;

    function connect() {
      if (!alive.current) return;
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("live");
        retryMs.current = 1_000;
      };

      ws.onmessage = (evt) => {
        try {
          // Binance combined stream: { stream: "btcusdt@miniTicker", data: {...} }
          const msg = JSON.parse(evt.data as string);
          const d = msg?.data;
          if (!d || d.e !== "24hrMiniTicker") return;

          const sym = ASSET_TO_SYM[d.s as string];
          if (!sym) return;
          const price = parseFloat(d.c);
          const open = parseFloat(d.o);
          if (!price || isNaN(price)) return;
          const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

          const prev = prevPrices.current[sym] ?? 0;
          if (prev && price !== prev) {
            const dir = price > prev ? "up" : "dn";
            setFlashing((f) => ({ ...f, [sym]: dir }));
            setTimeout(
              () => setFlashing((f) => { const n = { ...f }; delete n[sym]; return n; }),
              600
            );
          }
          prevPrices.current[sym] = price;

          setCoins((prev) =>
            prev.map((c) => (c.symbol === sym ? { ...c, price, change24h } : c))
          );
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        if (!alive.current) return;
        setStatus("error");
        setTimeout(() => {
          retryMs.current = Math.min(retryMs.current * 2, 30_000);
          connect();
        }, retryMs.current);
      };
    }

    connect();

    return () => {
      alive.current = false;
      wsRef.current?.close();
    };
  }, []);

  const items = [...coins, ...coins];

  return (
    <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] overflow-hidden">
      <div className="flex items-center">
        {/* Status label */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] border-r border-[#1a1a1a] z-10">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
              status === "live"
                ? "bg-[#22c55e] animate-pulse"
                : status === "error"
                ? "bg-[#ef4444]"
                : "bg-[#f0b429] animate-pulse"
            }`}
          />
          <span className="text-[10px] text-[#555] font-semibold uppercase tracking-widest whitespace-nowrap">
            {status === "live" ? "Live Markets" : status === "error" ? "Reconnecting…" : "Connecting…"}
          </span>
        </div>

        {/* Scrolling track */}
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="animate-ticker flex items-center">
            {items.map((coin, i) => {
              const up = coin.change24h >= 0;
              const flash = flashing[coin.symbol];
              return (
                <div
                  key={`${coin.symbol}-${i}`}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-r border-[#1a1a1a]"
                >
                  <span className="text-[11px] font-bold text-white">{coin.symbol}</span>
                  <span
                    className={`text-[11px] font-mono transition-colors duration-300 ${
                      flash === "up"
                        ? "text-[#22c55e]"
                        : flash === "dn"
                        ? "text-[#ef4444]"
                        : "text-[#888]"
                    }`}
                  >
                    {coin.price > 0 ? `$${fmt(coin.price)}` : "—"}
                  </span>
                  {coin.price > 0 && (
                    <span
                      className={`text-[10px] font-semibold ${
                        up ? "text-[#22c55e]" : "text-[#ef4444]"
                      }`}
                    >
                      {(up ? "+" : "") + coin.change24h.toFixed(2)}%
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
