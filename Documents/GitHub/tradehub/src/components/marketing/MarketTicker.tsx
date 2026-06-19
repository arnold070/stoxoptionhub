"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketCoin } from "@/app/api/market/route";

// ── Binance combined mini-ticker WebSocket ─────────────────────────────────
const WS_SYMBOLS = [
  "btcusdt","ethusdt","solusdt","bnbusdt","adausdt",
  "avaxusdt","dotusdt","maticusdt","linkusdt","xrpusdt","dogeusdt","ltcusdt",
];
const WS_URL =
  "wss://stream.binance.com:9443/stream?streams=" +
  WS_SYMBOLS.map((s) => `${s}@miniTicker`).join("/");

const DISPLAY_ORDER = [
  "BTC","ETH","SOL","BNB","ADA","AVAX","DOT","MATIC","LINK","XRP","DOGE","LTC",
];

const NAMES: Record<string, string> = {
  BTC:"Bitcoin", ETH:"Ethereum", SOL:"Solana", BNB:"BNB",
  ADA:"Cardano", AVAX:"Avalanche", DOT:"Polkadot", MATIC:"Polygon",
  LINK:"Chainlink", XRP:"XRP", DOGE:"Dogecoin", LTC:"Litecoin",
};

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
  // Track previous prices for flash colour
  const prevPrices = useRef<Record<string, number>>({});
  const [flashing, setFlashing] = useState<Record<string, "up" | "dn">>({});

  // ── Seed prices from REST on first load ──────────────────────────────────
  useEffect(() => {
    fetch("/api/market")
      .then((r) => (r.ok ? (r.json() as Promise<MarketCoin[]>) : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        setCoins(
          DISPLAY_ORDER.map((sym) => {
            const d = data.find((c) => c.symbol === sym);
            return { symbol: sym, price: d?.price ?? 0, change24h: d?.change24h ?? 0 };
          })
        );
      })
      .catch(() => {});
  }, []);

  // ── WebSocket for live price stream ──────────────────────────────────────
  useEffect(() => {
    alive.current = true;

    function connect() {
      if (!alive.current) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("live");
        retryMs.current = 1_000;
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string);
          const d = msg.data;
          if (!d || d.e !== "24hrMiniTicker") return;

          const symbol = (d.s as string).replace("USDT", "");
          const price = parseFloat(d.c);
          const open = parseFloat(d.o);
          const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

          // Determine flash direction
          const prev = prevPrices.current[symbol] ?? 0;
          if (prev && price !== prev) {
            const dir = price > prev ? "up" : "dn";
            setFlashing((f) => ({ ...f, [symbol]: dir }));
            setTimeout(
              () => setFlashing((f) => { const n = { ...f }; delete n[symbol]; return n; }),
              600
            );
          }
          prevPrices.current[symbol] = price;

          setCoins((prev) =>
            prev.map((c) => (c.symbol === symbol ? { ...c, price, change24h } : c))
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

  const items = [...coins, ...coins]; // doubled for seamless loop

  return (
    <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
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
